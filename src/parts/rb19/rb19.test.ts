// Checks the code-built RB19 against the 2023 FIA regulations (docs/facts.md) and basic mesh health.
import { describe, expect, it } from 'vitest'
import { Box3 } from 'three'
import { PARTS } from '../../data/parts.ts'
import {
  BODY_HALF_WIDTH,
  DRS_Y_MAX,
  FRONT_AXLE_X,
  FRONT_TYRE_WIDTH,
  MAX_FRONT_WING_ELEMENTS,
  REAR_AXLE_X,
  REAR_TYRE_WIDTH,
  REFERENCE_PLANE_HEIGHT,
  STROKE,
  TURBO_SHAFT_Y_MAX_MM,
  WHEELBASE,
  fromFront,
  fromRear,
} from './frame.ts'
import { OUTER_SHELL, PART_BUILDERS, mergeByMaterial, type Piece } from './index.ts'
import { CRANK_Y } from './powertrain.ts'
import { insideFrontWingVolume, insideRearWingProfiles } from './regulations.ts'

/** Car-frame vertex (m) → FIA coordinates (mm) measured from the front or rear axle. */
const toFia = (x: number, y: number, z: number, axleX: number) => ({
  along: (axleX - x) * 1000,
  side: z * 1000,
  up: (y - REFERENCE_PLANE_HEIGHT) * 1000,
})

/** Every vertex of the pieces that fails `inside`, as readable strings (empty = all inside). */
function outside(list: Piece[], axleX: number, inside: (along: number, side: number, up: number) => boolean): string[] {
  const misses: string[] = []
  for (const piece of list) {
    const position = piece.geometry.getAttribute('position')
    for (let i = 0; i < position.count; i++) {
      const p = toFia(position.getX(i), position.getY(i), position.getZ(i), axleX)
      if (!inside(p.along, p.side, p.up)) misses.push(`${piece.name} @ ${p.along.toFixed(0)}, ${p.side.toFixed(0)}, ${p.up.toFixed(0)}`)
    }
  }
  return misses
}

const built = new Map(Object.entries(PART_BUILDERS).map(([id, build]) => [id, build?.() ?? []]))
const pieces = (id: string) => built.get(id) ?? []
const named = (id: string, prefix: string) => pieces(id).filter((p) => p.name.startsWith(prefix))

function bounds(list: Piece[]): Box3 {
  const box = new Box3()
  for (const p of list) {
    p.geometry.computeBoundingBox()
    box.union(p.geometry.boundingBox!)
  }
  return box
}

const MM = 1e-6 // tolerance for float rounding, in metres

describe('every catalog part is built in code', () => {
  it.each(PARTS.map((p) => p.id))('%s has a builder with at least one piece', (id) => {
    expect(PART_BUILDERS[id], id).toBeDefined()
    expect(pieces(id).length).toBeGreaterThan(0)
  })

  it('only marks real catalog parts as X-ray outer shell', () => {
    const ids = new Set(PARTS.map((p) => p.id))
    for (const id of OUTER_SHELL) expect(ids.has(id), id).toBe(true)
  })

  it('has only finite vertex positions', () => {
    for (const [id, list] of built) {
      for (const piece of list) {
        const ok = Array.from(piece.geometry.getAttribute('position').array).every(Number.isFinite)
        expect(ok, `${id} / ${piece.name}`).toBe(true)
      }
    }
  })

  it('merges every part into one mesh per material', () => {
    for (const [id, list] of built) {
      const merged = mergeByMaterial(list)
      expect(merged.length, id).toBe(new Set(list.map((p) => p.material)).size)
    }
  })
})

describe('FIA 2023 dimensions', () => {
  it('uses a 3600 mm wheelbase (F-029)', () => {
    expect(FRONT_AXLE_X - REAR_AXLE_X).toBeCloseTo(WHEELBASE, 9)
    expect(WHEELBASE).toBeLessThanOrEqual(3.6)
  })

  it('keeps all bodywork within 2000 mm width; only tyres, rims and covers go wider (F-039)', () => {
    for (const [id, all] of built) {
      if (id === 'tyres') continue
      // Rims and wheel covers may go wider (F-039); everything else on the wheels may not.
      const list = id === 'wheel-rims' ? all.filter((p) => p.name === 'Wheel nut') : all
      const box = bounds(list)
      expect(box.max.z, id).toBeLessThanOrEqual(BODY_HALF_WIDTH + MM)
      expect(box.min.z, id).toBeGreaterThanOrEqual(-BODY_HALF_WIDTH - MM)
    }
  })

  it('keeps every front wing vertex inside the real RV-FW volume, with at most four elements (F-040, F-026)', () => {
    expect(outside(pieces('front-wing'), FRONT_AXLE_X, insideFrontWingVolume).slice(0, 5)).toEqual([])
    expect(named('front-wing', 'Front wing element').length).toBeLessThanOrEqual(MAX_FRONT_WING_ELEMENTS)
  })

  it('keeps every rear wing profile vertex inside RV-RW-PROFILES and the DRS flap within Y = 490 (F-041, F-042)', () => {
    const profiles = [...named('rear-wing', 'Rear wing main plane'), ...named('rear-wing', 'DRS flap')]
    expect(profiles).toHaveLength(2)
    expect(outside(profiles, REAR_AXLE_X, insideRearWingProfiles).slice(0, 5)).toEqual([])
    expect(bounds(named('rear-wing', 'DRS flap')).max.z).toBeLessThanOrEqual(DRS_Y_MAX / 1000 + MM)
  })

  it('puts the plank from XF = 430 to XR = −600 with its top on the reference plane (F-043, F-037)', () => {
    const box = bounds(pieces('plank'))
    expect(box.max.x).toBeCloseTo(fromFront(430, 0, 0)[0], 6)
    expect(box.min.x).toBeCloseTo(fromRear(-600, 0, 0)[0], 6)
    expect(box.max.y).toBeCloseTo(REFERENCE_PLANE_HEIGHT, 6)
    expect(box.max.y - box.min.y).toBeCloseTo(0.01, 6)
  })

  it('sizes the tyres within the allowed diameter and widths (F-022, F-023)', () => {
    for (const [label, width, minW, maxW] of [
      ['Front tyre', FRONT_TYRE_WIDTH, 0.345, 0.375],
      ['Rear tyre', REAR_TYRE_WIDTH, 0.44, 0.47],
    ] as const) {
      for (const tyre of named('tyres', label)) {
        tyre.geometry.computeBoundingBox()
        const box = tyre.geometry.boundingBox!
        expect(box.max.y - box.min.y).toBeLessThanOrEqual(0.725 + MM)
        expect(box.max.z - box.min.z).toBeCloseTo(width, 3)
        expect(width).toBeGreaterThanOrEqual(minW)
        expect(width).toBeLessThanOrEqual(maxW)
      }
    }
  })

  it('sizes the brake discs within the allowed diameters and thickness (F-025)', () => {
    for (const [label, min, max] of [
      ['Front brake disc', 0.325, 0.33],
      ['Rear brake disc', 0.275, 0.28],
    ] as const) {
      const discs = named('brake-discs', label)
      expect(discs).toHaveLength(2)
      for (const disc of discs) {
        disc.geometry.computeBoundingBox()
        const box = disc.geometry.boundingBox!
        const diameter = box.max.y - box.min.y
        expect(diameter).toBeGreaterThanOrEqual(min - MM)
        expect(diameter).toBeLessThanOrEqual(max + MM)
        expect(box.max.z - box.min.z).toBeLessThanOrEqual(0.032 + MM)
      }
    }
  })

  it('puts the crankshaft at Z = 90 mm and the turbo shaft within 25 mm of the centre line (F-044, F-045)', () => {
    expect(CRANK_Y).toBeCloseTo(REFERENCE_PLANE_HEIGHT + 0.09, 9)
    const shaft = bounds(named('turbocharger', 'Turbo shaft'))
    expect(Math.max(shaft.max.z, -shaft.min.z)).toBeLessThanOrEqual(TURBO_SHAFT_Y_MAX_MM / 1000)
  })

  it('derives a plausible stroke from 1600 cc, six cylinders and an 80 mm bore (F-003, F-004, F-005)', () => {
    expect(STROKE).toBeCloseTo(0.05305, 4)
  })

  it('builds six suspension members per corner (F-019)', () => {
    expect(pieces('front-suspension-arms')).toHaveLength(12)
    expect(pieces('rear-suspension-arms')).toHaveLength(12)
    expect(named('front-suspension-arms', 'Pull-rod')).toHaveLength(2)
    expect(named('rear-suspension-arms', 'Push-rod')).toHaveLength(2)
  })
})
