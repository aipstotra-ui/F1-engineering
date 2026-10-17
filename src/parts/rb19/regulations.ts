// The real FIA 2023 reference volumes for the wings (Technical Regulations Issue 7, Appendix),
// in FIA millimetres: XF/XR along the car (positive = rearwards), Y sideways from the centre line,
// Z up from the reference plane. Used to shape the wings and by the tests to check every vertex.

// ---------- Front wing, RV-FW (Appendix §21), F-040 ----------

/** §21.3: plane through three points; material below it is discarded. Returns its Z at (XF, Y). */
const PLANE_A = { xf: -825, y: 975, z: 100 }
const PLANE_SLOPE_XF = (125 - 100) / (-475 - -825) // from points A and B (same Y)
const PLANE_SLOPE_Y = (160 - 125) / (350 - 975) // from points B and C (same XF)
function cutPlaneZ(xf: number, y: number): number {
  return PLANE_A.z + PLANE_SLOPE_XF * (xf - PLANE_A.xf) + PLANE_SLOPE_Y * (y - PLANE_A.y)
}

/** Lowest allowed Z of the front wing at (XF, Y): §21.1 floor line, raised by the §21.3 plane. */
export function frontWingFloorZ(xf: number, y: number): number {
  const line = y <= 125 ? 135 : y >= 900 ? 100 : 135 - (35 * (y - 125)) / 775
  return Math.max(line, cutPlaneZ(xf, y))
}

/** Highest allowed Z of the front wing profiles (Y < 900), from the §21.1 section. */
export function frontWingCeilingZ(y: number): number {
  if (y <= 250) return 280 + (35 * y) / 250
  if (y <= 650) return 315
  return 315 - (115 * (Math.min(y, 900) - 650)) / 250
}

/** §21.10 plan-view outline: front edge swept back from XF −1350 at Y 0 to XF −975 at Y 975. */
export function frontWingPlanLimits(y: number): { xfFront: number; xfRear: number } {
  const xfFront = -1350 + (375 * y) / 975
  const xfRear = y <= 350 ? -800 + (250 * y) / 350 : y <= 900 ? -550 + (75 * (y - 350)) / 550 : -475
  return { xfFront, xfRear }
}

/** True if an FIA point lies inside RV-FW (profiles, endplate and tip regions together). */
export function insideFrontWingVolume(xf: number, yIn: number, z: number, tol = 0.5): boolean {
  const y = Math.abs(yIn)
  if (y > 975 + tol) return false
  const { xfFront, xfRear } = frontWingPlanLimits(y)
  if (xf < xfFront - tol || xf > xfRear + tol) return false
  if (z < frontWingFloorZ(xf, y) - tol || z > 475 + tol) return false
  if (y < 900) return z <= frontWingCeilingZ(y) + tol
  // Outboard of Y = 900: the endplate region (§21.13b, §21.14) above Z = 200 with its front edge cut by a plane,
  // and the tip region below Z = 200, which loses everything inboard of Y = 910 above Z = 170 (§21.15).
  if (z > 200) return xf >= -975 + ((z - 200) * 150) / 275 - tol
  return y >= 910 - tol || z <= 170 + tol
}

// ---------- Rear wing profiles, RV-RW-PROFILES (Appendix §28), F-041 ----------

/** §28.1 side-view outline (XR, Z), extruded sideways to Y = 480 (§28.2). */
export const REAR_WING_PROFILE_OUTLINE: [number, number][] = [
  [140, 670],
  [140, 825],
  [355, 825],
  [530, 910],
  [555, 910],
  [555, 670],
]

function insidePolygon(px: number, py: number, polygon: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

export function insideRearWingProfiles(xr: number, y: number, z: number): boolean {
  return Math.abs(y) <= 480 + 0.5 && insidePolygon(xr, z, REAR_WING_PROFILE_OUTLINE)
}
