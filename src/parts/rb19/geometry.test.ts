import { describe, expect, it } from 'vitest'
import type { BufferGeometry } from 'three'
import { loft, mirrorZ, nacaProfile, roundedBox, strut, topPlate, turned, wingElement } from './geometry.ts'

/** Volume enclosed by a closed mesh; positive when every face points outwards. */
function signedVolume(geometry: BufferGeometry): number {
  const position = geometry.getAttribute('position')
  const index = geometry.getIndex()
  const count = index ? index.count : position.count
  const vertex = (i: number) => {
    const k = index ? index.getX(i) : i
    return [position.getX(k), position.getY(k), position.getZ(k)]
  }
  let volume = 0
  for (let i = 0; i < count; i += 3) {
    const [a, b, c] = [vertex(i), vertex(i + 1), vertex(i + 2)]
    volume +=
      (a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6
  }
  return volume
}

function allFinite(geometry: BufferGeometry): boolean {
  return Array.from(geometry.getAttribute('position').array).every(Number.isFinite)
}

const body = loft([
  { x: 1, halfWidth: 0.2, top: 0.5, bottom: 0.1 },
  { x: 0, halfWidth: 0.3, top: 0.6, bottom: 0.1 },
  { x: -1, halfWidth: 0.1, top: 0.4, bottom: 0.2 },
])

describe('loft', () => {
  it('makes a closed body whose faces point outwards', () => {
    expect(allFinite(body)).toBe(true)
    expect(signedVolume(body)).toBeGreaterThan(0)
  })

  it('passes through the given sections', () => {
    const box = body.boundingBox!
    expect(box.max.x).toBeCloseTo(1, 3)
    expect(box.min.x).toBeCloseTo(-1, 3)
    expect(box.max.z).toBeGreaterThan(0.29)
  })
})

describe('aerofoils and wings', () => {
  it('gives a NACA 0012 a 12% maximum thickness', () => {
    const profile = nacaProfile(0, 0, 12, 60)
    const thickness = Math.max(...profile.map((p) => p.y)) - Math.min(...profile.map((p) => p.y))
    expect(thickness).toBeCloseTo(0.12, 2)
  })

  it('builds a closed wing element with outward faces, upright or upside down', () => {
    for (const inverted of [true, false]) {
      const wing = wingElement({
        naca: [6, 4, 10],
        span: [-0.5, 0.5],
        leadingEdgeX: () => 0,
        leadingEdgeY: () => 0.2,
        chord: () => 0.3,
        angleDeg: () => 10,
        inverted,
      })
      expect(allFinite(wing)).toBe(true)
      expect(signedVolume(wing)).toBeGreaterThan(0)
    }
  })
})

describe('other shapes', () => {
  it('keeps faces outward after mirroring', () => {
    expect(signedVolume(mirrorZ(body))).toBeGreaterThan(0)
    const plate = topPlate([[0, 0.1], [1, 0.1], [1, 0.5], [0, 0.5]], 0.04, 0.02)
    expect(signedVolume(mirrorZ(plate))).toBeCloseTo(signedVolume(plate), 6)
  })

  it('lays a top plate flat at the requested height', () => {
    const plate = topPlate([[0, 0.1], [1, 0.1], [1, 0.5], [0, 0.5]], 0.04, 0.02)
    expect(plate.boundingBox!.min.y).toBeCloseTo(0.04, 6)
    expect(plate.boundingBox!.max.y).toBeCloseTo(0.06, 6)
    expect(plate.boundingBox!.max.z).toBeCloseTo(0.5, 6)
    expect(signedVolume(plate)).toBeGreaterThan(0)
  })

  it('places struts, turned parts and boxes where asked', () => {
    const rod = strut([0, 0, 0], [1, 1, 0], 0.02)
    expect(rod.boundingBox!.max.x).toBeCloseTo(1.014, 2)
    const disc = turned([[0.1, -0.01], [0.16, -0.01], [0.16, 0.01], [0.1, 0.01]], [2, 0.3, 0.8], 'z')
    expect(disc.boundingBox!.max.y).toBeCloseTo(0.46, 3)
    expect(disc.boundingBox!.max.z).toBeCloseTo(0.81, 3)
    const box = roundedBox([0.4, 0.2, 0.1], [1, 2, 3])
    expect(box.boundingBox!.min.x).toBeCloseTo(0.8, 3)
    expect(box.boundingBox!.max.z).toBeCloseTo(3.05, 3)
  })
})
