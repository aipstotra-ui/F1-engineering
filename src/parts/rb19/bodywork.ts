// Survival cell, nose, halo, cockpit, sidepods, engine cover, floor, plank and diffuser.
// Regulated values come from frame.ts; every other number here is a styling choice taken from
// RB19 photos (metres, car frame: x forward, y up from the ground, z sideways).
import { CylinderGeometry } from 'three'
import { PLANK, REFERENCE_PLANE_HEIGHT as REF, fromFront, fromRear } from './frame.ts'
import { loft, pair, roundedBox, sidePlate, strut, topPlate, tubeThrough, type LoftStation } from './geometry.ts'
import type { Piece } from './types.ts'

const NOSE_TIP: LoftStation[] = [
  { x: 3.03, halfWidth: 0.04, top: 0.29, bottom: 0.235, topSquareness: 2.2, bottomSquareness: 2.2 },
  { x: 2.9, halfWidth: 0.07, top: 0.33, bottom: 0.22, topSquareness: 2.4, bottomSquareness: 2.4 },
]
const NOSE: LoftStation[] = [
  NOSE_TIP[1],
  { x: 2.62, halfWidth: 0.12, top: 0.41, bottom: 0.2, topSquareness: 2.6, bottomSquareness: 2.8 },
  { x: 2.3, halfWidth: 0.165, top: 0.49, bottom: 0.19, topSquareness: 2.8, bottomSquareness: 3 },
  { x: 2.0, halfWidth: 0.2, top: 0.555, bottom: 0.175, topSquareness: 3, bottomSquareness: 3 },
]
const MONOCOQUE: LoftStation[] = [
  { x: 2.02, halfWidth: 0.2, top: 0.555, bottom: 0.175, topSquareness: 3, bottomSquareness: 3 },
  { x: 1.65, halfWidth: 0.255, top: 0.625, bottom: 0.1, topSquareness: 3.2, bottomSquareness: 3.5 },
  { x: 1.25, halfWidth: 0.31, top: 0.66, bottom: 0.07, topSquareness: 3.5, bottomSquareness: 4 },
  { x: 0.95, halfWidth: 0.36, top: 0.655, bottom: 0.06, topSquareness: 3.5, bottomSquareness: 4 },
  { x: 0.6, halfWidth: 0.4, top: 0.565, bottom: 0.06, topSquareness: 4, bottomSquareness: 4 },
  { x: 0.3, halfWidth: 0.42, top: 0.575, bottom: 0.06, topSquareness: 4, bottomSquareness: 4 },
  { x: 0.05, halfWidth: 0.4, top: 0.63, bottom: 0.07, topSquareness: 4, bottomSquareness: 4 },
]
const ENGINE_COVER: LoftStation[] = [
  { x: 0.36, halfWidth: 0.1, top: 0.95, bottom: 0.72, topSquareness: 1.7, bottomSquareness: 2.2 },
  { x: 0.2, halfWidth: 0.2, top: 0.965, bottom: 0.58, topSquareness: 2, bottomSquareness: 3 },
  { x: 0.0, halfWidth: 0.3, top: 0.9, bottom: 0.4, topSquareness: 2.6, bottomSquareness: 3 },
  { x: -0.35, halfWidth: 0.33, top: 0.78, bottom: 0.22, topSquareness: 3.2, bottomSquareness: 3 },
  { x: -0.75, halfWidth: 0.27, top: 0.64, bottom: 0.2, topSquareness: 3.2, bottomSquareness: 3 },
  { x: -1.15, halfWidth: 0.18, top: 0.52, bottom: 0.22, topSquareness: 2.6, bottomSquareness: 3 },
  { x: -1.5, halfWidth: 0.11, top: 0.45, bottom: 0.25, topSquareness: 2.4, bottomSquareness: 2.6 },
  { x: -1.8, halfWidth: 0.065, top: 0.42, bottom: 0.28, topSquareness: 2.2, bottomSquareness: 2.4 },
]
// Left sidepod (mirrored for the right). Styling: high undercut at the front, steep downward ramp behind.
const SIDEPOD: LoftStation[] = [
  { x: 0.66, centerZ: 0.6, halfWidth: 0.15, top: 0.6, bottom: 0.42, topSquareness: 4.5, bottomSquareness: 3 },
  { x: 0.5, centerZ: 0.59, halfWidth: 0.18, top: 0.615, bottom: 0.3, topSquareness: 4.5, bottomSquareness: 2.6 },
  { x: 0.25, centerZ: 0.54, halfWidth: 0.23, top: 0.59, bottom: 0.14, topSquareness: 4.2, bottomSquareness: 2.6 },
  { x: -0.05, centerZ: 0.47, halfWidth: 0.25, top: 0.52, bottom: 0.09, topSquareness: 4, bottomSquareness: 3 },
  { x: -0.4, centerZ: 0.41, halfWidth: 0.22, top: 0.4, bottom: 0.08, topSquareness: 3.6, bottomSquareness: 3.5 },
  { x: -0.75, centerZ: 0.35, halfWidth: 0.17, top: 0.29, bottom: 0.075, topSquareness: 3.2, bottomSquareness: 3 },
  { x: -1.1, centerZ: 0.3, halfWidth: 0.12, top: 0.2, bottom: 0.075, topSquareness: 2.5, bottomSquareness: 3 },
]

const FLOOR_THICKNESS = 0.02
const FLOOR_TOP = REF + FLOOR_THICKNESS

export function monocoque(): Piece[] {
  const cockpitRim = Array.from({ length: 16 }, (_, i) => {
    const phi = (i / 16) * Math.PI * 2
    return [0.6 + 0.34 * Math.cos(phi), 0.585 + 0.02 * Math.cos(phi), 0.25 * Math.sin(phi)] as [number, number, number]
  })
  const opening = new CylinderGeometry(1, 1, 0.004, 40)
  opening.scale(0.33, 1, 0.24)
  opening.translate(0.6, 0.578, 0)
  return [
    { name: 'Survival cell', material: 'paint', geometry: loft(MONOCOQUE) },
    { name: 'Cockpit opening', material: 'black', geometry: opening },
    { name: 'Cockpit rim', material: 'carbon', geometry: tubeThrough(cockpitRim, 0.018, true) },
    ...pair(roundedBox([0.07, 0.05, 0.14], [0.78, 0.69, 0.52], 0.02)).map((geometry) => ({ name: 'Mirror housing', material: 'paint' as const, geometry })),
    ...pair(roundedBox([0.004, 0.04, 0.12], [0.744, 0.69, 0.52], 0.002)).map((geometry) => ({ name: 'Mirror glass', material: 'chrome' as const, geometry })),
    ...pair(strut([0.8, 0.665, 0.47], [0.86, 0.6, 0.33], 0.012, 0.5)).map((geometry) => ({ name: 'Mirror stalk', material: 'carbon' as const, geometry })),
  ]
}

export function nose(): Piece[] {
  const body = [NOSE_TIP[0], ...NOSE]
  // Livery (F-047): the RB19's nose is yellow on top and navy underneath. The panel stops just before the
  // nose meets the chassis, so two painted surfaces never fight at the same spot.
  const panel = [...body.slice(0, -1), { ...body[body.length - 1], x: 2.06, halfWidth: 0.19, top: 0.54, bottom: 0.18 }]
  return [
    { name: 'Nose', material: 'paint', geometry: loft(body) },
    { name: 'Nose livery', material: 'paintYellow', geometry: loft(panel, { arc: [0.3, 0.7], inflate: 0.003 }) },
  ]
}

export function halo(): Piece[] {
  const hoop: [number, number, number][] = [
    [0.3, 0.6, 0.25],
    [0.55, 0.765, 0.235],
    [0.8, 0.785, 0.12],
    [0.88, 0.79, 0],
    [0.8, 0.785, -0.12],
    [0.55, 0.765, -0.235],
    [0.3, 0.6, -0.25],
  ]
  return [
    { name: 'Halo hoop', material: 'paint', geometry: tubeThrough(hoop, 0.024) },
    { name: 'Halo pillar', material: 'paint', geometry: tubeThrough([[0.88, 0.79, 0], [0.97, 0.73, 0], [1.05, 0.655, 0]], 0.026) },
  ]
}

export function seat(): Piece[] {
  const headrest = Array.from({ length: 9 }, (_, i) => {
    const phi = Math.PI / 2 + (i / 8) * Math.PI // rear half of the cockpit opening
    return [0.6 + 0.31 * Math.cos(phi), 0.6, 0.22 * Math.sin(phi)] as [number, number, number]
  })
  return [
    { name: 'Headrest', material: 'carbonMatte', geometry: tubeThrough(headrest, 0.038) },
    { name: 'Seat back', material: 'carbonMatte', geometry: roundedBox([0.05, 0.36, 0.38], [0.3, 0.38, 0], 0.02, [0, 0, -0.45]) },
    { name: 'Seat base', material: 'carbonMatte', geometry: roundedBox([0.42, 0.04, 0.34], [0.55, 0.12, 0], 0.02) },
  ]
}

export function steeringWheel(): Piece[] {
  const tilt: [number, number, number] = [0, 0, 0.35]
  return [
    { name: 'Wheel body', material: 'carbon', geometry: roundedBox([0.03, 0.14, 0.27], [0.86, 0.6, 0], 0.015, tilt) },
    { name: 'Display', material: 'black', geometry: roundedBox([0.006, 0.05, 0.1], [0.842, 0.607, 0], 0.003, tilt) },
    ...pair(roundedBox([0.045, 0.1, 0.04], [0.86, 0.585, 0.13], 0.018, tilt)).map((geometry) => ({
      name: 'Grip',
      material: 'rubber' as const,
      geometry,
    })),
  ]
}

export function sidepods(): Piece[] {
  const inlet = roundedBox([0.01, 0.13, 0.22], [0.665, 0.51, 0.6], 0.03)
  // The upper lip overhangs the letterbox inlet, as on the RB19.
  const lip = roundedBox([0.08, 0.012, 0.27], [0.69, 0.604, 0.6], 0.005)
  return [
    ...pair(loft(SIDEPOD)).map((geometry) => ({ name: 'Sidepod', material: 'paint' as const, geometry })),
    ...pair(inlet).map((geometry) => ({ name: 'Radiator inlet', material: 'black' as const, geometry })),
    ...pair(lip).map((geometry) => ({ name: 'Inlet lip', material: 'paint' as const, geometry })),
  ]
}

export function engineCover(): Piece[] {
  const inlet = new CylinderGeometry(1, 1, 0.01, 32)
  inlet.rotateZ(Math.PI / 2)
  inlet.scale(1, 0.085, 0.065)
  inlet.translate(0.365, 0.84, 0)
  const lip = tubeThrough(
    Array.from({ length: 12 }, (_, i) => {
      const phi = (i / 12) * Math.PI * 2
      return [0.366, 0.84 + 0.088 * Math.sin(phi), 0.068 * Math.cos(phi)] as [number, number, number]
    }),
    0.008,
    true,
  )
  return [
    { name: 'Engine cover', material: 'paint', geometry: loft(ENGINE_COVER) },
    { name: 'Airbox inlet', material: 'black', geometry: inlet },
    { name: 'Airbox lip', material: 'paintRed', geometry: lip },
    // Livery (F-047): yellow airbox top. TV camera on top of the roll hoop.
    { name: 'Airbox livery', material: 'paintYellow', geometry: loft(ENGINE_COVER.slice(0, 3), { arc: [0.3, 0.7], inflate: 0.003, along: 16 }) },
    {
      name: 'Engine cover fin',
      material: 'paint',
      geometry: sidePlate(
        [
          [0.12, 0.93],
          [-0.5, 0.74],
          [-1.15, 0.56],
          [-1.15, 0.5],
          [-0.5, 0.68],
          [0.12, 0.88],
        ],
        0,
        0.006,
      ),
    },
    { name: 'TV camera', material: 'black', geometry: roundedBox([0.12, 0.03, 0.05], [0.22, 1.0, 0], 0.01) },
    { name: 'Camera mount', material: 'carbon', geometry: strut([0.22, 0.955, 0], [0.22, 0.99, 0], 0.008) },
  ]
}

export function floor(): Piece[] {
  const outline: [number, number][] = [
    [1.05, 0.45],
    [0.75, 0.76],
    [-0.55, 0.8],
    [-1.05, 0.74],
    [-1.28, 0.58],
    [-1.28, -0.58],
    [-1.05, -0.74],
    [-0.55, -0.8],
    [0.75, -0.76],
    [1.05, -0.45],
  ]
  // Raised roofs over the tunnel inlets at the front of the floor, with fences underneath.
  const inletRoof = loft(
    [
      { x: 1.45, centerZ: 0.23, halfWidth: 0.2, top: 0.215, bottom: 0.203, topSquareness: 6, bottomSquareness: 6 },
      { x: 1.22, centerZ: 0.23, halfWidth: 0.21, top: 0.145, bottom: 0.133, topSquareness: 6, bottomSquareness: 6 },
      { x: 1.0, centerZ: 0.24, halfWidth: 0.22, top: FLOOR_TOP, bottom: FLOOR_TOP - 0.012, topSquareness: 6, bottomSquareness: 6 },
    ],
    { along: 16, radial: 24 },
  )
  const fence = (z: number) =>
    sidePlate(
      [
        [1.45, REF],
        [1.45, 0.205],
        [1.22, 0.135],
        [1.0, FLOOR_TOP - 0.01],
        [1.0, REF],
      ],
      z,
      0.006,
    )
  return [
    { name: 'Floor', material: 'carbonMatte', geometry: topPlate(outline, REF, FLOOR_THICKNESS) },
    ...pair(
      sidePlate(
        [
          [0.7, REF + 0.02],
          [-0.55, REF + 0.02],
          [-0.55, REF + 0.07],
          [0.0, REF + 0.06],
          [0.7, REF + 0.045],
        ],
        0.795,
        0.006,
      ),
    ).map((geometry) => ({ name: 'Floor edge lip', material: 'carbon' as const, geometry })),
    ...pair(inletRoof).map((geometry) => ({ name: 'Tunnel inlet', material: 'carbonMatte' as const, geometry })),
    ...[0.1, 0.22, 0.34].flatMap((z) =>
      pair(fence(z)).map((geometry) => ({ name: 'Floor fence', material: 'carbon' as const, geometry })),
    ),
  ]
}

export function plank(): Piece[] {
  const [front] = fromFront(PLANK.xfFront, 0, 0)
  const [rear] = fromRear(PLANK.xrRear, 0, 0)
  const width = 0.3 // styling
  return [
    {
      name: 'Plank',
      material: 'plank',
      geometry: roundedBox([front - rear, PLANK.thickness, width], [(front + rear) / 2, REF - PLANK.thickness / 2, 0], 0.003),
    },
  ]
}

export function diffuser(): Piece[] {
  const ramp = loft(
    [
      { x: -1.25, halfWidth: 0.5, top: 0.08, bottom: 0.066, topSquareness: 8, bottomSquareness: 8 },
      { x: -1.6, halfWidth: 0.52, top: 0.14, bottom: 0.126, topSquareness: 8, bottomSquareness: 8 },
      { x: -1.9, halfWidth: 0.52, top: 0.23, bottom: 0.216, topSquareness: 8, bottomSquareness: 8 },
      { x: -2.12, halfWidth: 0.5, top: 0.33, bottom: 0.316, topSquareness: 8, bottomSquareness: 8 },
    ],
    { along: 24, radial: 32 },
  )
  const wall = (z: number, thickness: number) =>
    sidePlate(
      [
        [-1.25, REF + 0.02],
        [-2.12, REF + 0.04],
        [-2.12, 0.33],
        [-1.6, 0.14],
        [-1.25, 0.08],
      ],
      z,
      thickness,
    )
  return [
    { name: 'Diffuser roof', material: 'carbonMatte', geometry: ramp },
    ...pair(wall(0.51, 0.008)).map((geometry) => ({ name: 'Diffuser side wall', material: 'carbon' as const, geometry })),
    ...[0.18, 0.34].flatMap((z) =>
      pair(wall(z, 0.005)).map((geometry) => ({ name: 'Diffuser strake', material: 'carbon' as const, geometry })),
    ),
  ]
}
