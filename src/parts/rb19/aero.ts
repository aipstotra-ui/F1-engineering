// Front wing, rear wing (with DRS flap) and beam wing, built from NACA aerofoils.
// The front wing is solved into the real FIA volume (regulations.ts, F-040) at every span position,
// and the tests check every vertex against it; chords and angles are styling choices.
import { FRONT_AXLE_X, REFERENCE_PLANE_HEIGHT as REF } from './frame.ts'
import { nacaProfile, pair, roundedBox, sidePlate, strut, wingElement } from './geometry.ts'
import { frontWingCeilingZ, frontWingFloorZ, frontWingPlanLimits } from './regulations.ts'
import type { Piece } from './types.ts'

/** 0 at the car centre line, 1 at the wing tip, for a span running −half … +half. */
const fromCentre = (s: number) => Math.abs(2 * s - 1)

interface FrontElement {
  naca: [number, number, number]
  chord: number
  /** Angle at the centre and at mid-span (degrees); mid-span has the most room. */
  angle: [number, number]
}

// Four elements: the maximum allowed (F-026).
const FRONT_ELEMENTS: FrontElement[] = [
  { naca: [8, 4, 10], chord: 0.24, angle: [2, 5] },
  { naca: [7, 4, 9], chord: 0.14, angle: [6, 15] },
  { naca: [7, 4, 9], chord: 0.11, angle: [10, 24] },
  { naca: [7, 4, 9], chord: 0.09, angle: [14, 32] },
]
/** Profiles must stay inboard of Y = 900 mm; the endplate sits in the tip region beyond Y = 910 mm. */
const FRONT_SPAN = 0.899
const FRONT_ENDPLATE_Z = 0.915
const MARGIN = 0.003 // keep 3 mm clear of the regulation surfaces
const SLOT_GAP = 0.006 // gap between neighbouring elements
const OVERLAP = 0.8 // each element starts at 80% of the previous one's chord

/** How far an element's section reaches above, below and behind its leading edge (metres). */
function sectionExtent(element: FrontElement, chord: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180
  let top = -Infinity
  let bottom = Infinity
  let back = 0
  for (const p of nacaProfile(...element.naca)) {
    const v = -p.y // racing wings are upside down
    const dy = chord * (p.x * Math.sin(a) + v * Math.cos(a))
    const dx = chord * (-p.x * Math.cos(a) + v * Math.sin(a))
    top = Math.max(top, dy)
    bottom = Math.min(bottom, dy)
    back = Math.min(back, dx)
  }
  return { top, bottom, back }
}

/** 0 at the centre and the tips, 1 across the middle of the span where the wing may be tallest. */
function midSpan(yMm: number): number {
  if (yMm <= 250) return yMm / 250
  if (yMm <= 650) return 1
  return Math.max(0.3, 1 - (0.7 * (yMm - 650)) / 250)
}

/** Elements slim down towards the tips, where the FIA volume is only about 100 mm tall. */
function chordScale(yMm: number): number {
  if (yMm <= 650) return 1
  return 1 - (0.35 * (Math.min(yMm, 900) - 650)) / 250
}

interface StackedElement {
  leX: number
  leY: number
  chord: number
  angle: number
}

/**
 * Stacks the four elements at one sideways position: the first sits just above the FIA floor,
 * each next one just above the previous, starting behind the swept leading-edge limit. If the stack
 * would poke through the FIA ceiling, all angles are reduced until it fits.
 */
function stackAt(zLateral: number): StackedElement[] {
  const yMm = Math.abs(zLateral) * 1000
  const firstLeX = FRONT_AXLE_X - frontWingPlanLimits(yMm).xfFront / 1000 - MARGIN * 4
  const ceiling = REF + frontWingCeilingZ(yMm) / 1000 - MARGIN
  let stack: StackedElement[] = []
  for (let scale = 1; scale > 0.15; scale -= 0.05) {
    stack = []
    let leX = firstLeX
    let previousTop = -Infinity
    for (const element of FRONT_ELEMENTS) {
      const angle = (element.angle[0] + (element.angle[1] - element.angle[0]) * midSpan(yMm)) * scale
      const chord = element.chord * chordScale(yMm)
      const extent = sectionExtent(element, chord, angle)
      const xfRear = (FRONT_AXLE_X - (leX + extent.back)) * 1000
      const floor = REF + frontWingFloorZ(xfRear, yMm) / 1000 + MARGIN
      const leY = Math.max(floor - extent.bottom, previousTop + SLOT_GAP - extent.bottom)
      stack.push({ leX, leY, chord, angle })
      previousTop = leY + extent.top
      leX -= chord * Math.cos((angle * Math.PI) / 180) * OVERLAP
    }
    if (previousTop <= ceiling) break
  }
  return stack
}

export function frontWing(): Piece[] {
  const cache = new Map<number, StackedElement[]>()
  const zAt = (s: number) => -FRONT_SPAN + 2 * FRONT_SPAN * s
  const stack = (s: number) => {
    const key = Math.round(zAt(s) * 1e6)
    let value = cache.get(key)
    if (!value) cache.set(key, (value = stackAt(zAt(s))))
    return value
  }
  const elements = FRONT_ELEMENTS.map((element, i) => ({
    name: `Front wing element ${i + 1}`,
    material: (i === 0 ? 'paint' : 'carbon') as 'paint' | 'carbon',
    geometry: wingElement({
      naca: element.naca,
      span: [-FRONT_SPAN, FRONT_SPAN],
      stations: 36,
      leadingEdgeX: (s) => stack(s)[i].leX,
      leadingEdgeY: (s) => stack(s)[i].leY,
      chord: (s) => stack(s)[i].chord,
      angleDeg: (s) => stack(s)[i].angle,
    }),
  }))
  // Endplate in the tip/endplate region (Y 910–975 mm): up to Z 380 mm, front edge kept behind the §21.14 cut.
  const endplate = sidePlate(
    [
      [2.775, REF + 0.105],
      [2.31, REF + 0.131], // bottom edge rises with the §21.3 cut plane
      [2.31, REF + 0.33],
      [2.42, REF + 0.38],
      [2.65, REF + 0.38],
      [2.77, REF + 0.2],
    ],
    FRONT_ENDPLATE_Z,
    0.008,
  )
  return [
    ...elements,
    ...pair(endplate).map((geometry) => ({ name: 'Front wing endplate', material: 'paint' as const, geometry })),
  ]
}

const REAR_SPAN = 0.47

export function rearWing(): Piece[] {
  const mainPlane = wingElement({
    naca: [9, 4, 11],
    span: [-REAR_SPAN, REAR_SPAN],
    leadingEdgeX: () => -1.955,
    // "Spoon" shape: slightly lower in the middle.
    leadingEdgeY: (s) => 0.79 - 0.015 * (1 - fromCentre(s) ** 2),
    chord: () => 0.215,
    angleDeg: (s) => 8 + 2 * fromCentre(s),
  })
  const drsFlap = wingElement({
    naca: [6, 4, 9],
    span: [-REAR_SPAN, REAR_SPAN],
    leadingEdgeX: () => -2.135,
    leadingEdgeY: () => 0.835,
    chord: () => 0.165,
    angleDeg: () => 28,
  })
  const endplate = sidePlate(
    [
      [-1.93, 0.4],
      [-2.35, 0.4],
      [-2.35, 0.9],
      [-2.3, 0.95],
      [-1.98, 0.95],
      [-1.93, 0.88],
    ],
    0.485,
    0.008,
  )
  return [
    { name: 'Rear wing main plane', material: 'carbon', geometry: mainPlane },
    { name: 'DRS flap', material: 'paint', geometry: drsFlap },
    ...pair(endplate).map((geometry) => ({ name: 'Rear wing endplate', material: 'paint' as const, geometry })),
    { name: 'Wing pillar', material: 'carbon', geometry: strut([-2.05, 0.4, 0], [-2.04, 0.79, 0], 0.02, 0.35) },
    { name: 'DRS actuator', material: 'darkMetal', geometry: roundedBox([0.06, 0.07, 0.035], [-2.12, 0.835, 0], 0.012) },
  ]
}

export function beamWing(): Piece[] {
  const element = (leX: number, leY: number, chord: number, angle: number) =>
    wingElement({
      naca: [6, 4, 10],
      span: [-0.4, 0.4],
      leadingEdgeX: () => leX,
      leadingEdgeY: () => leY,
      chord: () => chord,
      angleDeg: () => angle,
    })
  return [
    { name: 'Beam wing lower', material: 'carbon', geometry: element(-1.97, 0.3, 0.12, 12) },
    { name: 'Beam wing upper', material: 'carbon', geometry: element(-2.1, 0.355, 0.1, 24) },
  ]
}
