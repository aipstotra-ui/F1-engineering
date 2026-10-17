// Power unit, cooling, gearbox and rear crash structure (the "internals", seen in X-ray mode).
// Regulated: 90° V6 with 80 mm bore and the crankshaft at Z = 90 mm (F-004, F-005, F-044);
// turbo shaft on the centre line (F-045). Everything else is a styling choice.
import { CRANK_Z_MM, REFERENCE_PLANE_HEIGHT, V_ANGLE_DEG, type Vec3 } from './frame.ts'
import { loft, pair, roundedBox, strut, tubeThrough, turned } from './geometry.ts'
import type { Piece } from './types.ts'

/** Height of the crankshaft centre line above the ground. */
export const CRANK_Y = REFERENCE_PLANE_HEIGHT + CRANK_Z_MM / 1000
const ENGINE_FRONT = 0.0
const ENGINE_REAR = -0.58
const ENGINE_MID = (ENGINE_FRONT + ENGINE_REAR) / 2
const ENGINE_LENGTH = ENGINE_FRONT - ENGINE_REAR
const HALF_V = ((V_ANGLE_DEG / 2) * Math.PI) / 180
/** Turbocharger shaft: on the centre line (z = 0), behind the engine. */
export const TURBO_Y = 0.42

/** Point along one cylinder bank, `distance` out from the crankshaft. side = 1 left, −1 right. */
const bankPoint = (distance: number, side: 1 | -1): [number, number] => [
  CRANK_Y + distance * Math.cos(HALF_V),
  side * distance * Math.sin(HALF_V),
]

export function v6Engine(): Piece[] {
  const banks = ([1, -1] as const).flatMap((side) => {
    const [blockY, blockZ] = bankPoint(0.17, side)
    const [coverY, coverZ] = bankPoint(0.32, side)
    const tilt: Vec3 = [side * HALF_V, 0, 0]
    return [
      { name: 'Cylinder bank', material: 'aluminium' as const, geometry: roundedBox([ENGINE_LENGTH, 0.26, 0.15], [ENGINE_MID, blockY, blockZ], 0.02, tilt) },
      { name: 'Cam cover', material: 'darkMetal' as const, geometry: roundedBox([ENGINE_LENGTH - 0.02, 0.05, 0.17], [ENGINE_MID, coverY, coverZ], 0.02, tilt) },
    ]
  })
  return [
    { name: 'Crankcase', material: 'aluminium', geometry: roundedBox([ENGINE_LENGTH, 0.14, 0.3], [ENGINE_MID, CRANK_Y, 0], 0.03) },
    ...banks,
    { name: 'Intake plenum', material: 'carbon', geometry: roundedBox([ENGINE_LENGTH - 0.08, 0.1, 0.16], [ENGINE_MID, 0.36, 0], 0.04) },
  ]
}

/** Snail-shaped turbo housing, turned around the shaft (x axis). */
function housing(x: number, scale: number) {
  const profile: [number, number][] = [
    [0.02, -0.05],
    [0.1, -0.04],
    [0.11, 0],
    [0.1, 0.04],
    [0.045, 0.05],
    [0.045, 0.08],
  ].map(([r, h]) => [r * Math.abs(scale), h * scale]) // negative scale mirrors along the shaft
  return turned(profile, [x, TURBO_Y, 0], 'x')
}

export function turbocharger(): Piece[] {
  return [
    { name: 'Compressor', material: 'aluminium', geometry: housing(-0.66, 1) },
    { name: 'Turbine', material: 'heatMetal', geometry: housing(-0.9, -0.9) },
    { name: 'Turbo shaft', material: 'titanium', geometry: strut([-0.6, TURBO_Y, 0], [-0.96, TURBO_Y, 0], 0.012) },
  ]
}

export function mguH(): Piece[] {
  return [{ name: 'MGU-H', material: 'darkMetal', geometry: turned([[0.001, -0.06], [0.055, -0.06], [0.055, 0.06], [0.001, 0.06]], [-0.78, TURBO_Y, 0], 'x') }]
}

export function mguK(): Piece[] {
  return [
    { name: 'MGU-K', material: 'darkMetal', geometry: turned([[0.001, -0.09], [0.065, -0.09], [0.065, 0.09], [0.001, 0.09]], [-0.05, 0.15, 0.2], 'x') },
    { name: 'MGU-K drive', material: 'titanium', geometry: strut([0.04, 0.15, 0.2], [0.04, CRANK_Y, 0.05], 0.015) },
  ]
}

export function exhaust(): Piece[] {
  const manifold = (side: 1 | -1): Vec3[] => [
    [-0.08, 0.27, side * 0.24],
    [-0.3, 0.27, side * 0.27],
    [-0.55, 0.31, side * 0.22],
    [-0.8, 0.4, side * 0.1],
    [-0.9, TURBO_Y, side * 0.03],
  ]
  return [
    { name: 'Left manifold', material: 'heatMetal', geometry: tubeThrough(manifold(1), 0.03) },
    { name: 'Right manifold', material: 'heatMetal', geometry: tubeThrough(manifold(-1), 0.03) },
    {
      name: 'Tailpipe',
      material: 'heatMetal',
      geometry: tubeThrough([[-0.95, TURBO_Y, 0], [-1.4, 0.41, 0], [-1.9, 0.41, 0], [-2.13, 0.44, 0]], 0.04),
    },
  ]
}

export function intercooler(): Piece[] {
  return [{ name: 'Intercooler', material: 'radiator', geometry: roundedBox([0.25, 0.22, 0.05], [-0.15, 0.3, 0.5], 0.01, [0, 0.2, 0]) }]
}

export function energyStore(): Piece[] {
  return [{ name: 'Energy Store', material: 'darkMetal', geometry: roundedBox([0.32, 0.09, 0.44], [0.2, 0.11, 0], 0.015) }]
}

export function controlElectronics(): Piece[] {
  return [
    { name: 'Control unit', material: 'black', geometry: roundedBox([0.18, 0.1, 0.14], [-0.45, 0.22, 0.4], 0.01) },
    { name: 'Cooling fins', material: 'aluminium', geometry: roundedBox([0.16, 0.012, 0.12], [-0.45, 0.276, 0.4], 0.004) },
  ]
}

export function radiators(): Piece[] {
  return pair(roundedBox([0.07, 0.3, 0.26], [0.3, 0.35, 0.6], 0.01, [0, 0, 0.6])).map((geometry) => ({
    name: 'Radiator',
    material: 'radiator' as const,
    geometry,
  }))
}

export function oilCooler(): Piece[] {
  return [{ name: 'Oil cooler', material: 'radiator', geometry: roundedBox([0.05, 0.18, 0.16], [-0.05, 0.26, -0.55], 0.008, [0, 0, 0.4]) }]
}

export function gearbox(): Piece[] {
  const casing = loft(
    [
      { x: -0.6, halfWidth: 0.13, top: 0.32, bottom: 0.12, topSquareness: 3, bottomSquareness: 3 },
      { x: -1.1, halfWidth: 0.12, top: 0.34, bottom: 0.16, topSquareness: 3, bottomSquareness: 3 },
      { x: -1.6, halfWidth: 0.11, top: 0.38, bottom: 0.24, topSquareness: 3, bottomSquareness: 3 },
      { x: -2.0, halfWidth: 0.09, top: 0.4, bottom: 0.28, topSquareness: 3, bottomSquareness: 3 },
    ],
    { along: 24 },
  )
  return [
    { name: 'Gearbox casing', material: 'titanium', geometry: casing },
    ...pair(strut([-1.8, 0.33, 0.09], [-1.8, 0.36, 0.6], 0.022)).map((geometry) => ({
      name: 'Driveshaft',
      material: 'darkMetal' as const,
      geometry,
    })),
  ]
}

export function rearCrashStructure(): Piece[] {
  return [
    {
      name: 'Rear impact structure',
      material: 'carbon',
      geometry: loft(
        [
          { x: -2.0, halfWidth: 0.085, top: 0.4, bottom: 0.27, topSquareness: 3, bottomSquareness: 3 },
          { x: -2.45, halfWidth: 0.05, top: 0.36, bottom: 0.3, topSquareness: 3, bottomSquareness: 3 },
        ],
        { along: 8 },
      ),
    },
    { name: 'Rain light', material: 'paintRed', geometry: roundedBox([0.012, 0.035, 0.06], [-2.455, 0.33, 0], 0.005) },
  ]
}
