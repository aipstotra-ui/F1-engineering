// The car's coordinate frame and its regulated sizes.
//
// three.js frame used for the whole car (metres): x points forward, y points up, z points sideways.
// The ground is y = 0 and the car's centre line is z = 0.
// FIA drawings use millimetres with X pointing backwards, measured from the front axle (XF) or the rear
// axle (XR), Y sideways and Z up from the reference plane. fromFront()/fromRear() convert them.

/** Wheelbase, modelled at the maximum allowed. */
export const WHEELBASE = 3.6 // F-029
/** No bodywork outboard of this (tyres, rims and wheel covers excepted). */
export const BODY_HALF_WIDTH = 1.0 // F-039

export const FRONT_AXLE_X = WHEELBASE / 2
export const REAR_AXLE_X = -WHEELBASE / 2

/** Styling choice, not a regulation value: height of the reference plane (plank top) above the ground. */
export const REFERENCE_PLANE_HEIGHT = 0.04

/** Tyres: diameter at most 725 mm (F-023); widths chosen inside the allowed ranges (F-022). */
export const TYRE_DIAMETER = 0.72 // F-023
export const FRONT_TYRE_WIDTH = 0.36 // F-022 (345–375 mm)
export const REAR_TYRE_WIDTH = 0.455 // F-022 (440–470 mm)
export const RIM_LIP_DIAMETER = 0.4906 // F-021
export const WHEEL_CENTRE_HEIGHT = TYRE_DIAMETER / 2

/** Styling choice: tyre outer faces line up with the 2000 mm bodywork width. */
export const FRONT_TRACK_HALF = BODY_HALF_WIDTH - FRONT_TYRE_WIDTH / 2
export const REAR_TRACK_HALF = BODY_HALF_WIDTH - REAR_TYRE_WIDTH / 2

/** Brake discs: at most 32 mm thick; diameters inside the allowed ranges. */
export const DISC_THICKNESS = 0.032 // F-025
export const FRONT_DISC_DIAMETER = 0.328 // F-025 (325–330 mm)
export const REAR_DISC_DIAMETER = 0.278 // F-025 (275–280 mm)

/** Plank: 10 mm thick (F-037), from XF = 430 to XR = −600, top on the reference plane (F-043). */
export const PLANK = { xfFront: 430, xrRear: -600, thickness: 0.01 } // F-037, F-043

/** Reference volumes the wings must fit inside, in FIA millimetres. */
export const FRONT_WING_BOX = { xfMin: -1350, xfMax: -475, yMax: 975, zMin: 0, zMax: 500 } // F-040
export const REAR_WING_BOX = { xrMin: 140, xrMax: 555, yMax: 480, zMin: 670, zMax: 910 } // F-041
export const DRS_Y_MAX = 490 // F-042
export const MAX_FRONT_WING_ELEMENTS = 4 // F-026

/** Engine: 1600 cc V6 at 90°, 80 mm bore, crankshaft on the centre line at Z = 90 mm. */
export const ENGINE_DISPLACEMENT_CC = 1600 // F-003
export const CYLINDERS = 6 // F-004
export const V_ANGLE_DEG = 90 // F-004
export const BORE = 0.08 // F-005
export const CRANK_Z_MM = 90 // F-044
/** Stroke follows from the rules above: displacement per cylinder ÷ bore area. */
export const STROKE = (ENGINE_DISPLACEMENT_CC / CYLINDERS) * 1e-6 / (Math.PI * (BORE / 2) ** 2)
/** Turbo shaft must sit inboard of Y = 25 mm. */
export const TURBO_SHAFT_Y_MAX_MM = 25 // F-045

export type Vec3 = [number, number, number]

/** FIA point measured from the front axle (mm) → car frame (m). Negative XF is ahead of the axle. */
export function fromFront(xf: number, y: number, z: number): Vec3 {
  return [FRONT_AXLE_X - xf / 1000, REFERENCE_PLANE_HEIGHT + z / 1000, y / 1000]
}

/** FIA point measured from the rear axle (mm) → car frame (m). Positive XR is behind the axle. */
export function fromRear(xr: number, y: number, z: number): Vec3 {
  return [REAR_AXLE_X - xr / 1000, REFERENCE_PLANE_HEIGHT + z / 1000, y / 1000]
}
