// Shape-making tools for the code-built car. Every function returns a three.js BufferGeometry already
// placed in the car frame (see frame.ts), so a part is just a list of these plus a material name.
// Pure three.js: no React, no DOM, so the shapes can be tested in Node.
import {
  BufferGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  LatheGeometry,
  Matrix4,
  Quaternion,
  Shape,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three'
import type { Vec3 } from './frame.ts'

// ---------- small helpers ----------

/** Catmull-Rom interpolation through `values` at fractional index t (clamped at the ends). */
function catmull(values: number[], t: number): number {
  const n = values.length
  if (n === 1) return values[0]
  const i = Math.min(Math.max(Math.floor(t), 0), n - 2)
  const f = t - i
  const p0 = values[Math.max(i - 1, 0)]
  const p1 = values[i]
  const p2 = values[i + 1]
  const p3 = values[Math.min(i + 2, n - 1)]
  return 0.5 * (2 * p1 + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f)
}

/** sign(v)·|v|^e: bends a circle into a rounded square when e < 1 (superellipse). */
function signedPow(v: number, e: number): number {
  return Math.sign(v) * Math.abs(v) ** e
}

function finish(geometry: BufferGeometry): BufferGeometry {
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  return geometry
}

// ---------- loft: smooth bodywork from cross-sections ----------

/**
 * One cross-section of a lofted body, at position x along the car.
 * The section is a superellipse: squareness 2 is an ellipse, higher numbers are boxier.
 */
export interface LoftStation {
  x: number
  halfWidth: number
  top: number
  bottom: number
  /** Sideways centre of the section (0 = car centre line). */
  centerZ?: number
  /** Squareness of the upper and lower halves (default 2.5). */
  topSquareness?: number
  bottomSquareness?: number
}

export interface LoftOptions {
  /** Points around each section. */
  radial?: number
  /** Sections sampled along the body (smoothly interpolated between the given stations). */
  along?: number
  capStart?: boolean
  capEnd?: boolean
}

/** Builds a smooth closed body through the given cross-sections (ordered front to back). */
export function loft(stations: LoftStation[], options: LoftOptions = {}): BufferGeometry {
  const { radial = 48, along = 48, capStart = true, capEnd = true } = options
  if (stations.length < 2) throw new Error('loft needs at least two stations')

  const get = (key: keyof LoftStation, fallback: number) => stations.map((s) => (s[key] as number | undefined) ?? fallback)
  const xs = get('x', 0)
  const halfWidths = get('halfWidth', 0)
  const tops = get('top', 0)
  const bottoms = get('bottom', 0)
  const centers = get('centerZ', 0)
  const topSq = get('topSquareness', 2.5)
  const bottomSq = get('bottomSquareness', 2.5)

  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const ringSize = radial + 1 // repeat the first point so the texture wraps cleanly
  let length = 0
  let previous: [number, number] | null = null

  for (let a = 0; a < along; a++) {
    const t = (a / (along - 1)) * (stations.length - 1)
    const x = catmull(xs, t)
    const hw = Math.max(catmull(halfWidths, t), 1e-4)
    const top = catmull(tops, t)
    const bottom = catmull(bottoms, t)
    const cz = catmull(centers, t)
    const mid = (top + bottom) / 2
    const hh = Math.max((top - bottom) / 2, 1e-4)
    if (previous) length += Math.hypot(x - previous[0], mid - previous[1])
    previous = [x, mid]

    for (let r = 0; r < ringSize; r++) {
      // Start at the bottom centre so the texture seam is hidden underneath.
      const theta = -Math.PI / 2 + (r / radial) * Math.PI * 2
      const c = Math.cos(theta)
      const s = Math.sin(theta)
      const e = 2 / (s >= 0 ? catmull(topSq, t) : catmull(bottomSq, t))
      positions.push(x, mid + hh * signedPow(s, e), cz + hw * signedPow(c, e))
      uvs.push((r / radial) * 4, length * 4)
    }
  }

  for (let a = 0; a < along - 1; a++) {
    for (let r = 0; r < radial; r++) {
      const i0 = a * ringSize + r
      const i1 = i0 + 1
      const j0 = i0 + ringSize
      const j1 = j0 + 1
      indices.push(i0, i1, j0, i1, j1, j0)
    }
  }

  const addCap = (ring: number, flip: boolean) => {
    const base = ring * ringSize
    let cx = 0
    let cy = 0
    let cz = 0
    for (let r = 0; r < radial; r++) {
      cx += positions[(base + r) * 3]
      cy += positions[(base + r) * 3 + 1]
      cz += positions[(base + r) * 3 + 2]
    }
    const centre = positions.length / 3
    positions.push(cx / radial, cy / radial, cz / radial)
    uvs.push(0.5, 0.5)
    for (let r = 0; r < radial; r++) {
      if (flip) indices.push(centre, base + r + 1, base + r)
      else indices.push(centre, base + r, base + r + 1)
    }
  }
  if (capStart) addCap(0, true)
  if (capEnd) addCap(along - 1, false)

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  return finish(geometry)
}

// ---------- wings: NACA aerofoils swept along a span ----------

/**
 * NACA 4-digit aerofoil as a closed loop of (u, v) points in chord units:
 * u runs 0 (leading edge) → 1 (trailing edge), v is height. Upper surface TE→LE, then lower LE→TE.
 */
export function nacaProfile(camberPct: number, camberPosTenths: number, thicknessPct: number, samples = 24): Vector2[] {
  const m = camberPct / 100
  const p = camberPosTenths / 10
  const t = thicknessPct / 100
  const upper: Vector2[] = []
  const lower: Vector2[] = []
  for (let i = 0; i <= samples; i++) {
    const u = (1 - Math.cos((i / samples) * Math.PI)) / 2 // cosine spacing: more points near the edges
    const yt = 5 * t * (0.2969 * Math.sqrt(u) - 0.126 * u - 0.3516 * u ** 2 + 0.2843 * u ** 3 - 0.1036 * u ** 4)
    let yc = 0
    let dyc = 0
    if (m > 0 && p > 0) {
      if (u < p) {
        yc = (m / p ** 2) * (2 * p * u - u ** 2)
        dyc = ((2 * m) / p ** 2) * (p - u)
      } else {
        yc = (m / (1 - p) ** 2) * (1 - 2 * p + 2 * p * u - u ** 2)
        dyc = ((2 * m) / (1 - p) ** 2) * (p - u)
      }
    }
    const angle = Math.atan(dyc)
    upper.push(new Vector2(u - yt * Math.sin(angle), yc + yt * Math.cos(angle)))
    lower.push(new Vector2(u + yt * Math.sin(angle), yc - yt * Math.cos(angle)))
  }
  return [...upper.reverse(), ...lower.slice(1)]
}

export interface WingElementSpec {
  /** NACA 4-digit code as [camber %, camber position (tenths), thickness %]. */
  naca: [number, number, number]
  /** Sideways extent (car z), e.g. [-0.9, 0.9]. */
  span: [number, number]
  stations?: number
  /** All functions take s = 0 at span[0] … 1 at span[1]. */
  leadingEdgeX: (s: number) => number
  leadingEdgeY: (s: number) => number
  chord: (s: number) => number
  /** Angle of attack in degrees; positive lifts the trailing edge. */
  angleDeg: (s: number) => number
  /** Racing wings are upside down so they push the car down (default true). */
  inverted?: boolean
}

/** A wing element: the aerofoil profile swept along the span, with closed ends. */
export function wingElement(spec: WingElementSpec): BufferGeometry {
  const { naca, span, stations = 24, inverted = true } = spec
  const profile = nacaProfile(...naca)
  const n = profile.length
  const half = (n + 1) / 2 // upper and lower surfaces share the leading-edge point
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  for (let k = 0; k <= stations; k++) {
    const s = k / stations
    const z = span[0] + (span[1] - span[0]) * s
    const chord = spec.chord(s)
    const angle = (spec.angleDeg(s) * Math.PI) / 180
    const lx = spec.leadingEdgeX(s)
    const ly = spec.leadingEdgeY(s)
    // Chord direction points backwards (−x) and up by the angle; normal points up.
    const dx = -Math.cos(angle)
    const dy = Math.sin(angle)
    const nx = Math.sin(angle)
    const ny = Math.cos(angle)
    for (let i = 0; i < n; i++) {
      const u = profile[i].x
      const v = inverted ? -profile[i].y : profile[i].y
      positions.push(lx + chord * (u * dx + v * nx), ly + chord * (u * dy + v * ny), z)
      uvs.push(i / (n - 1), s * 4)
    }
  }

  for (let k = 0; k < stations; k++) {
    for (let i = 0; i < n - 1; i++) {
      const a = k * n + i
      const b = a + n
      if (inverted) indices.push(a, a + 1, b, a + 1, b + 1, b)
      else indices.push(a, b, a + 1, a + 1, b, b + 1)
    }
  }
  // End caps: pair each upper-surface point with the matching lower-surface point.
  const cap = (k: number, flip: boolean) => {
    const base = k * n
    for (let i = 0; i < half - 1; i++) {
      const upperA = base + i
      const upperB = base + i + 1
      const lowerA = base + n - 1 - i
      const lowerB = base + n - 2 - i
      if (flip) indices.push(upperA, lowerA, upperB, upperB, lowerA, lowerB)
      else indices.push(upperA, upperB, lowerA, upperB, lowerB, lowerA)
    }
  }
  cap(0, inverted)
  cap(stations, !inverted)

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  return finish(geometry)
}

// ---------- rods, tubes, turned parts, plates and boxes ----------

/** A straight rod between two points. `flatten` < 1 squashes it into an aerofoil-like fairing. */
export function strut(a: Vec3, b: Vec3, radius: number, flatten = 1, segments = 12): BufferGeometry {
  const start = new Vector3(...a)
  const end = new Vector3(...b)
  const direction = end.clone().sub(start)
  const geometry = new CylinderGeometry(radius, radius, direction.length(), segments)
  geometry.scale(1, 1, flatten)
  const rotation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.clone().normalize())
  geometry.applyMatrix4(new Matrix4().compose(start.add(end).multiplyScalar(0.5), rotation, new Vector3(1, 1, 1)))
  return finish(geometry)
}

/** A tube following a smooth curve through the points (exhausts, halo, cockpit rim). */
export function tubeThrough(points: Vec3[], radius: number, closed = false, segments = 64): BufferGeometry {
  const curve = new CatmullRomCurve3(
    points.map((p) => new Vector3(...p)),
    closed,
    'centripetal',
  )
  return finish(new TubeGeometry(curve, segments, radius, 12, closed))
}

/**
 * A part turned on a lathe (wheels, discs, turbo housings). `profile` is a list of
 * (radius, position along the axis) pairs; the result spins around `axis` through `centre`.
 */
export function turned(profile: [number, number][], centre: Vec3, axis: 'x' | 'z', segments = 48): BufferGeometry {
  const geometry = new LatheGeometry(
    profile.map(([r, h]) => new Vector2(Math.max(r, 1e-4), h)),
    segments,
  )
  // LatheGeometry spins around +y; turn that to the requested axis.
  if (axis === 'z') geometry.rotateX(Math.PI / 2)
  else geometry.rotateZ(-Math.PI / 2)
  geometry.translate(...centre)
  return finish(geometry)
}

/** A flat plate cut to a 2D outline in the side view (x, y), `thickness` thick, centred on z. */
export function sidePlate(outline: [number, number][], z: number, thickness: number): BufferGeometry {
  const shape = new Shape(outline.map(([x, y]) => new Vector2(x, y)))
  const geometry = new ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false })
  geometry.translate(0, 0, z - thickness / 2)
  return finish(geometry)
}

/** A flat plate cut to a 2D outline in the top view (x, z), lying at height y, `thickness` thick. */
export function topPlate(outline: [number, number][], y: number, thickness: number): BufferGeometry {
  const shape = new Shape(outline.map(([x, z]) => new Vector2(x, z)))
  const geometry = new ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false })
  // Shape (x, z) is drawn in the xy plane and extruded along +z; turn it to lie flat (a rotation keeps the faces outward).
  geometry.rotateX(Math.PI / 2)
  geometry.translate(0, y + thickness, 0)
  return finish(geometry)
}

/** A box with softly rounded edges, centred at `centre`, optionally rotated (radians, XYZ order). */
export function roundedBox(size: Vec3, centre: Vec3, radius = 0.01, rotation: Vec3 = [0, 0, 0]): BufferGeometry {
  const [w, h, d] = size
  const r = Math.min(radius, w / 2 - 1e-4, h / 2 - 1e-4)
  const shape = new Shape()
  shape.moveTo(-w / 2 + r, -h / 2)
  shape.lineTo(w / 2 - r, -h / 2)
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r)
  shape.lineTo(w / 2, h / 2 - r)
  shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2)
  shape.lineTo(-w / 2 + r, h / 2)
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r)
  shape.lineTo(-w / 2, -h / 2 + r)
  shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2)
  const bevel = Math.min(r, d / 2 - 1e-4)
  const geometry = new ExtrudeGeometry(shape, {
    depth: Math.max(d - 2 * bevel, 1e-4),
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: 0,
    bevelSegments: 2,
    curveSegments: 4,
  })
  geometry.translate(0, 0, -(d - 2 * bevel) / 2)
  geometry.rotateX(rotation[0])
  geometry.rotateY(rotation[1])
  geometry.rotateZ(rotation[2])
  geometry.translate(...centre)
  return finish(geometry)
}

/** Mirror copy across the car centre line (z → −z), with faces turned the right way out. */
export function mirrorZ(geometry: BufferGeometry): BufferGeometry {
  const copy = geometry.clone()
  copy.scale(1, 1, -1)
  const index = copy.getIndex()
  if (index) {
    const array = index.array
    for (let i = 0; i < array.length; i += 3) {
      const tmp = array[i + 1]
      array[i + 1] = array[i + 2]
      array[i + 2] = tmp
    }
    index.needsUpdate = true
  } else {
    const position = copy.getAttribute('position')
    const normal = copy.getAttribute('normal')
    const uv = copy.getAttribute('uv')
    for (const attribute of [position, normal, uv]) {
      if (!attribute) continue
      const size = attribute.itemSize
      const array = attribute.array
      for (let i = 0; i < attribute.count; i += 3) {
        for (let c = 0; c < size; c++) {
          const a = (i + 1) * size + c
          const b = (i + 2) * size + c
          const tmp = array[a]
          array[a] = array[b]
          array[b] = tmp
        }
      }
      attribute.needsUpdate = true
    }
  }
  return finish(copy)
}

/** The geometry plus its mirror image: most car parts come in left/right pairs. */
export function pair(geometry: BufferGeometry): BufferGeometry[] {
  return [geometry, mirrorZ(geometry)]
}
