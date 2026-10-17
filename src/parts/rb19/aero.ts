// Front wing, rear wing (with DRS flap) and beam wing, built from NACA aerofoils.
// Positions must stay inside the FIA reference volumes in frame.ts (the tests check this);
// chords, angles and curves are styling choices from RB19 photos.
import { pair, roundedBox, sidePlate, strut, wingElement } from './geometry.ts'
import type { Piece } from './types.ts'

/** 0 at the car centre line, 1 at the wing tip, for a span running −half … +half. */
const fromCentre = (s: number) => Math.abs(2 * s - 1)

interface ElementStyle {
  leX: [number, number] // leading edge x at centre, change towards the tip
  leY: [number, number]
  chord: [number, number]
  angle: [number, number]
  naca: [number, number, number]
}

// Four elements: the maximum allowed (F-026). They sweep upwards towards the endplates.
const FRONT_ELEMENTS: ElementStyle[] = [
  { leX: [3.1, -0.06], leY: [0.085, 0.04], chord: [0.3, -0.04], angle: [3, 5], naca: [8, 4, 10] },
  { leX: [2.9, -0.05], leY: [0.125, 0.07], chord: [0.17, -0.02], angle: [14, 8], naca: [7, 4, 9] },
  { leX: [2.78, -0.04], leY: [0.18, 0.09], chord: [0.13, -0.015], angle: [26, 8], naca: [7, 4, 9] },
  { leX: [2.69, -0.03], leY: [0.245, 0.1], chord: [0.11, -0.01], angle: [38, 6], naca: [7, 4, 9] },
]
const FRONT_SPAN = 0.93
const FRONT_ENDPLATE_Z = 0.935

export function frontWing(): Piece[] {
  const elements = FRONT_ELEMENTS.map((e, i) => ({
    name: `Front wing element ${i + 1}`,
    material: (i === 0 ? 'paint' : 'carbon') as 'paint' | 'carbon',
    geometry: wingElement({
      naca: e.naca,
      span: [-FRONT_SPAN, FRONT_SPAN],
      leadingEdgeX: (s) => e.leX[0] + e.leX[1] * fromCentre(s),
      leadingEdgeY: (s) => e.leY[0] + e.leY[1] * fromCentre(s) ** 2,
      chord: (s) => e.chord[0] + e.chord[1] * fromCentre(s),
      angleDeg: (s) => e.angle[0] + e.angle[1] * fromCentre(s),
    }),
  }))
  const endplate = sidePlate(
    [
      [3.1, 0.06],
      [2.62, 0.06],
      [2.58, 0.2],
      [2.62, 0.32],
      [2.74, 0.35],
      [2.92, 0.24],
      [3.1, 0.12],
    ],
    FRONT_ENDPLATE_Z,
    0.01,
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
    leadingEdgeY: () => 0.843,
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
