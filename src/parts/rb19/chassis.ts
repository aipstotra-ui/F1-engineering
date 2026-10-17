// Suspension, uprights, springs/dampers, wheels, tyres and brakes.
// Wheel, tyre and disc sizes are regulated (frame.ts); pick-up points are styling choices.
// RB19 layout: pull-rods at the front, push-rods at the rear (F-033); six members per wheel (F-019).
import {
  DISC_THICKNESS,
  FRONT_AXLE_X,
  FRONT_DISC_DIAMETER,
  FRONT_TRACK_HALF,
  FRONT_TYRE_WIDTH,
  REAR_AXLE_X,
  REAR_DISC_DIAMETER,
  REAR_TRACK_HALF,
  REAR_TYRE_WIDTH,
  RIM_LIP_DIAMETER,
  TYRE_DIAMETER,
  WHEEL_CENTRE_HEIGHT,
  type Vec3,
} from './frame.ts'
import { pair, roundedBox, strut, turned } from './geometry.ts'
import type { MaterialKind, Piece } from './types.ts'

interface Corner {
  label: string
  centre: Vec3 // wheel centre (left side; right side mirrors z)
  width: number
  disc: number
}

const CORNERS: Corner[] = [
  { label: 'Front', centre: [FRONT_AXLE_X, WHEEL_CENTRE_HEIGHT, FRONT_TRACK_HALF], width: FRONT_TYRE_WIDTH, disc: FRONT_DISC_DIAMETER },
  { label: 'Rear', centre: [REAR_AXLE_X, WHEEL_CENTRE_HEIGHT, REAR_TRACK_HALF], width: REAR_TYRE_WIDTH, disc: REAR_DISC_DIAMETER },
]
const RIM_RADIUS = RIM_LIP_DIAMETER / 2
const TYRE_RADIUS = TYRE_DIAMETER / 2

/** Both sides of the car: the same corner with z mirrored, and "outboard" flipped to match. */
function bothSides(corner: Corner, build: (centre: Vec3, outward: 1 | -1) => Piece[]): Piece[] {
  const [x, y, z] = corner.centre
  return [...build([x, y, z], 1), ...build([x, y, -z], -1)]
}

const rods = (name: string, material: MaterialKind, links: [Vec3, Vec3][], radius = 0.016): Piece[] =>
  links.flatMap(([a, b]) => pair(strut(a, b, radius, 0.4)).map((geometry) => ({ name, material, geometry })))

export function frontSuspensionArms(): Piece[] {
  const upper: Vec3 = [1.8, 0.53, 0.68]
  const lower: Vec3 = [1.8, 0.19, 0.7]
  return [
    ...rods('Upper wishbone', 'carbon', [
      [[2.08, 0.47, 0.18], upper],
      [[1.5, 0.5, 0.26], upper],
    ]),
    ...rods('Lower wishbone', 'carbon', [
      [[2.05, 0.22, 0.17], lower],
      [[1.45, 0.17, 0.27], lower],
    ]),
    ...rods('Pull-rod', 'carbon', [[[1.79, 0.5, 0.66], [1.74, 0.14, 0.2]]]),
    ...rods('Track rod (steering)', 'carbon', [[[1.72, 0.37, 0.68], [1.76, 0.37, 0.21]]]),
  ]
}

export function rearSuspensionArms(): Piece[] {
  const upper: Vec3 = [-1.8, 0.53, 0.58]
  const lower: Vec3 = [-1.8, 0.19, 0.6]
  return [
    ...rods('Upper wishbone', 'carbon', [
      [[-1.45, 0.48, 0.14], upper],
      [[-1.98, 0.47, 0.12], upper],
    ]),
    ...rods('Lower wishbone', 'carbon', [
      [[-1.38, 0.2, 0.16], lower],
      [[-1.98, 0.19, 0.13], lower],
    ]),
    ...rods('Push-rod', 'carbon', [[[-1.79, 0.21, 0.57], [-1.68, 0.47, 0.1]]]),
    ...rods('Toe link', 'carbon', [[[-1.95, 0.31, 0.58], [-1.98, 0.31, 0.12]]]),
  ]
}

function uprights(corner: Corner): Piece[] {
  return bothSides(corner, ([x, y, z], out) => [
    {
      name: `${corner.label} upright`,
      material: 'titanium',
      geometry: roundedBox([0.09, 0.3, 0.06], [x, y, z - out * (corner.width / 2 - 0.06)], 0.015),
    },
  ])
}
export const frontUprights = () => uprights(CORNERS[0])
export const rearUprights = () => uprights(CORNERS[1])

export function frontRockersDampers(): Piece[] {
  return [
    ...pair(roundedBox([0.08, 0.05, 0.1], [1.74, 0.15, 0.12], 0.01)).map((geometry) => ({
      name: 'Rocker',
      material: 'titanium' as const,
      geometry,
    })),
    ...rods('Damper', 'darkMetal', [[[1.74, 0.16, 0.1], [1.42, 0.17, 0.05]]], 0.018),
    { name: 'Anti-roll bar', material: 'darkMetal', geometry: strut([1.74, 0.17, -0.1], [1.74, 0.17, 0.1], 0.012) },
  ]
}

export function rearRockersDampers(): Piece[] {
  return [
    ...pair(roundedBox([0.08, 0.05, 0.1], [-1.68, 0.47, 0.1], 0.01)).map((geometry) => ({
      name: 'Rocker',
      material: 'titanium' as const,
      geometry,
    })),
    ...rods('Damper', 'darkMetal', [[[-1.68, 0.47, 0.09], [-1.32, 0.45, 0.05]]], 0.018),
    { name: 'Anti-roll bar', material: 'darkMetal', geometry: strut([-1.68, 0.45, -0.08], [-1.68, 0.45, 0.08], 0.012) },
  ]
}

/** Tyre cross-section: from the rim, up the sidewall, round the shoulder, across the tread and back. */
function tyreProfile(width: number): [number, number][] {
  const h = width / 2
  const shoulder = 0.035
  const points: [number, number][] = [[RIM_RADIUS, -h + 0.012], [RIM_RADIUS + 0.02, -h + 0.002], [TYRE_RADIUS - shoulder, -h]]
  for (let i = 1; i <= 5; i++) {
    const a = (i / 6) * (Math.PI / 2)
    points.push([TYRE_RADIUS - shoulder + shoulder * Math.sin(a), -h + shoulder - shoulder * Math.cos(a)])
  }
  points.push([TYRE_RADIUS, -h + shoulder], [TYRE_RADIUS, h - shoulder])
  for (let i = 1; i <= 5; i++) {
    const a = (i / 6) * (Math.PI / 2)
    points.push([TYRE_RADIUS - shoulder + shoulder * Math.cos(a), h - shoulder + shoulder * Math.sin(a)])
  }
  points.push([TYRE_RADIUS - shoulder, h], [RIM_RADIUS + 0.02, h - 0.002], [RIM_RADIUS, h - 0.012])
  return points
}

export function tyres(): Piece[] {
  return CORNERS.flatMap((corner) =>
    bothSides(corner, (centre, out) => {
      const h = (corner.width / 2 + 0.002) * out
      return [
        { name: `${corner.label} tyre`, material: 'rubber', geometry: turned(tyreProfile(corner.width), centre, 'z', 64) },
        // Coloured sidewall band (styling). Not a logo.
        { name: 'Compound band', material: 'tyreStripe', geometry: turned([[0.3, h], [0.312, h]], centre, 'z', 64) },
      ]
    }),
  )
}

export function wheelRims(): Piece[] {
  return CORNERS.flatMap((corner) =>
    bothSides(corner, (centre, out) => {
      const h = corner.width / 2
      return [
        { name: `${corner.label} rim`, material: 'rimMetal', geometry: turned([[RIM_RADIUS, -h + 0.012], [RIM_RADIUS, h - 0.012]], centre, 'z') },
        // Wheel cover on the outer face (F-046).
        { name: 'Wheel cover', material: 'rimMetal', geometry: turned([[0.001, out * (h - 0.01)], [RIM_RADIUS, out * (h - 0.01)]], centre, 'z') },
        { name: 'Rim lip', material: 'paintRed', geometry: turned([[RIM_RADIUS - 0.014, out * (h - 0.008)], [RIM_RADIUS, out * (h - 0.008)]], centre, 'z', 64) },
        {
          name: 'Wheel nut',
          material: 'paintRed',
          // Recessed so it stays inside the tyre face (bodywork width limit, F-039).
          geometry: turned([[0.04, out * (h - 0.025)], [0.04, out * (h - 0.004)], [0.001, out * (h - 0.004)]], centre, 'z', 24),
        },
      ]
    }),
  )
}

/** Axial position of the brake disc: tucked inside the rim, towards the car. */
const discOffset = (corner: Corner) => -(corner.width / 2 - 0.1)

export function brakeDiscs(): Piece[] {
  return CORNERS.flatMap((corner) =>
    bothSides(corner, (centre, out) => {
      const mid = out * discOffset(corner)
      const h0 = mid - DISC_THICKNESS / 2
      const h1 = mid + DISC_THICKNESS / 2
      const outer = corner.disc / 2
      const inner = outer - 0.055
      const profile: [number, number][] = [[inner, h0], [outer, h0], [outer, h1], [inner, h1], [inner, h0]]
      return [{ name: `${corner.label} brake disc`, material: 'brakeCarbon', geometry: turned(profile, centre, 'z', 64) }]
    }),
  )
}

export function brakeCalipers(): Piece[] {
  return CORNERS.flatMap((corner) =>
    bothSides(corner, ([x, y, z], out) => {
      const angle = (3 * Math.PI) / 4 // top, towards the back
      const r = corner.disc / 2 - 0.01
      const centre: Vec3 = [x + r * Math.cos(angle), y + r * Math.sin(angle), z + out * discOffset(corner)]
      return [
        {
          name: `${corner.label} caliper`,
          material: 'aluminium',
          geometry: roundedBox([0.14, 0.07, 0.06], centre, 0.018, [0, 0, angle - Math.PI / 2]),
        },
      ]
    }),
  )
}

export function brakeDucts(): Piece[] {
  return CORNERS.flatMap((corner) =>
    bothSides(corner, ([x, y, z], out) => {
      const inner = out * -(corner.width / 2 - 0.03)
      const drumEnd = out * discOffset(corner) + out * 0.03
      return [
        { name: `${corner.label} brake drum`, material: 'carbon', geometry: turned([[0.2, inner], [0.2, drumEnd]], [x, y, z], 'z') },
        { name: `${corner.label} duct inlet`, material: 'carbon', geometry: roundedBox([0.14, 0.1, 0.07], [x + 0.17, y - 0.06, z + inner], 0.02) },
        // Small winglets on top of the rear brake ducts.
        ...(corner.label === 'Rear'
          ? [0, 0.04].map((dy) => ({
              name: 'Rear duct winglet',
              material: 'carbon' as const,
              geometry: roundedBox([0.16, 0.006, 0.1], [x + 0.08, 0.56 + dy, z + inner - out * 0.04], 0.003, [0, 0, 0.12]),
            }))
          : []),
      ]
    }),
  )
}
