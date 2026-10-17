// Every material the car uses, in three looks: realistic, hologram, and highlighted/ghosted variants.
// Materials are created once and shared (see src/scene/CLAUDE.md); never create one per render.
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  DoubleSide,
  MeshPhysicalMaterial,
  RepeatWrapping,
  ShaderMaterial,
  SRGBColorSpace,
  Vector2,
  type Material,
} from 'three'
import type { MaterialKind } from '../parts/rb19/index.ts'
import type { ViewMode } from '../state/carStore.ts'
export type Variant = 'normal' | 'highlight' | 'ghost'

/** RB19-style colours without logos (docs/design.md). */
const NAVY = '#161c32' // the RB19's very dark, satin navy
const RED = '#d8202f'
const YELLOW = '#f5c400'

/** Twill-weave carbon fibre pattern, drawn once on a small canvas. */
function carbonTexture(): CanvasTexture | null {
  if (typeof document === 'undefined') return null
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const cell = size / 8
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const warp = (x + y) % 4 < 2 // 2×2 twill
      const gradient = warp
        ? ctx.createLinearGradient(x * cell, 0, (x + 1) * cell, 0)
        : ctx.createLinearGradient(0, y * cell, 0, (y + 1) * cell)
      gradient.addColorStop(0, '#0d0f12')
      gradient.addColorStop(0.5, '#2b2f36')
      gradient.addColorStop(1, '#0d0f12')
      ctx.fillStyle = gradient
      ctx.fillRect(x * cell, y * cell, cell, cell)
    }
  }
  const texture = new CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = RepeatWrapping
  texture.repeat.set(6, 6)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

/** Bump map for the weave: each tow is raised in the middle, so reflections ripple like real carbon. */
function carbonNormalTexture(): CanvasTexture | null {
  if (typeof document === 'undefined') return null
  const size = 64
  const cell = size / 8
  const height = (px: number, py: number) => {
    const x = ((px % size) + size) % size
    const y = ((py % size) + size) % size
    const cx = Math.floor(x / cell)
    const cy = Math.floor(y / cell)
    const warp = (cx + cy) % 4 < 2
    const local = warp ? (x % cell) / cell : (y % cell) / cell
    return Math.sin(local * Math.PI)
  }
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const image = ctx.createImageData(size, size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = height(x + 1, y) - height(x - 1, y)
      const dy = height(x, y + 1) - height(x, y - 1)
      const nx = -dx * 2
      const ny = -dy * 2
      const length = Math.hypot(nx, ny, 1)
      const i = (y * size + x) * 4
      image.data[i] = ((nx / length) * 0.5 + 0.5) * 255
      image.data[i + 1] = ((ny / length) * 0.5 + 0.5) * 255
      image.data[i + 2] = ((1 / length) * 0.5 + 0.5) * 255
      image.data[i + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
  const texture = new CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = RepeatWrapping
  texture.repeat.set(6, 6)
  return texture
}

let carbonMap: CanvasTexture | null | undefined
let carbonNormal: CanvasTexture | null | undefined

function realistic(kind: MaterialKind): MeshPhysicalMaterial {
  const base = { side: DoubleSide }
  switch (kind) {
    case 'paint':
      return new MeshPhysicalMaterial({ ...base, color: NAVY, roughness: 0.42, metalness: 0.25, clearcoat: 0.6, clearcoatRoughness: 0.28 })
    case 'paintRed':
      return new MeshPhysicalMaterial({ ...base, color: RED, roughness: 0.45, clearcoat: 0.4 })
    case 'paintYellow':
      return new MeshPhysicalMaterial({ ...base, color: YELLOW, roughness: 0.4, metalness: 0.05, clearcoat: 0.5, clearcoatRoughness: 0.3 })
    case 'carbon':
    case 'carbonMatte': {
      if (carbonMap === undefined) carbonMap = carbonTexture()
      if (carbonNormal === undefined) carbonNormal = carbonNormalTexture()
      const gloss = kind === 'carbon'
      return new MeshPhysicalMaterial({
        ...base,
        map: carbonMap ?? undefined,
        normalMap: carbonNormal ?? undefined,
        normalScale: gloss ? new Vector2(0.35, 0.35) : new Vector2(0.2, 0.2),
        roughness: gloss ? 0.35 : 0.75,
        metalness: gloss ? 0.2 : 0.05,
        color: gloss ? '#ffffff' : '#6e6e6e',
        clearcoat: gloss ? 0.9 : 0.05,
        clearcoatRoughness: 0.15,
      })
    }
    case 'rubber':
      return new MeshPhysicalMaterial({ ...base, color: '#141414', roughness: 0.68, metalness: 0, sheen: 0.15, sheenRoughness: 0.7, sheenColor: '#3a3a3a' })
    case 'tyreStripe':
      return new MeshPhysicalMaterial({ ...base, color: YELLOW, roughness: 0.7 })
    case 'rimMetal':
      return new MeshPhysicalMaterial({ ...base, color: '#2a2c30', roughness: 0.35, metalness: 0.9 })
    case 'titanium':
      return new MeshPhysicalMaterial({ ...base, color: '#8d8f93', roughness: 0.38, metalness: 0.95 })
    case 'aluminium':
      return new MeshPhysicalMaterial({ ...base, color: '#b9bcc2', roughness: 0.3, metalness: 0.95 })
    case 'darkMetal':
      return new MeshPhysicalMaterial({ ...base, color: '#3a3d43', roughness: 0.4, metalness: 0.85 })
    case 'heatMetal':
      // Exhaust alloy turns bronze and blue with heat.
      return new MeshPhysicalMaterial({ ...base, color: '#8a6a4a', roughness: 0.35, metalness: 0.9, iridescence: 0.6, iridescenceIOR: 1.6 })
    case 'brakeCarbon':
      return new MeshPhysicalMaterial({ ...base, color: '#2d2d2f', roughness: 0.75, metalness: 0.1 })
    case 'radiator':
      return new MeshPhysicalMaterial({ ...base, color: '#9aa3ab', roughness: 0.55, metalness: 0.7 })
    case 'plank':
      return new MeshPhysicalMaterial({ ...base, color: '#a07c4f', roughness: 0.8 })
    case 'chrome':
      return new MeshPhysicalMaterial({ ...base, color: '#e8ecf2', roughness: 0.04, metalness: 1 })
    case 'black':
      return new MeshPhysicalMaterial({ ...base, color: '#050505', roughness: 0.6 })
  }
}

/** Glowing edge ("fresnel") shader for the Spider-Man hologram look. */
function hologram(color: string, strength: number): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: { color: { value: new Color(color) }, strength: { value: strength } },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 color;
      uniform float strength;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.0);
        gl_FragColor = vec4(color * (0.12 + 1.3 * rim) * strength, (0.08 + 0.8 * rim) * strength);
        #include <colorspace_fragment>
      }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    // Additive glow looks the same in any order, so one pass is enough (half the GPU work).
    forceSinglePass: true,
  })
}

const cache = new Map<string, Material>()

/** The shared material for a part's piece in the current view. */
export function getMaterial(kind: MaterialKind, mode: ViewMode, variant: Variant): Material {
  // Every part looks the same in hologram mode, so those materials are shared across kinds.
  const key = mode === 'hologram' ? `hologram|${variant}` : `${kind}|${mode}|${variant}`
  let material = cache.get(key)
  if (material) return material

  if (mode === 'hologram') {
    material =
      variant === 'highlight' ? hologram('#ffd84a', 1.4) : variant === 'ghost' ? hologram('#3ad8ff', 0.35) : hologram('#3ad8ff', 1)
  } else {
    const m = realistic(kind)
    if (variant === 'highlight') {
      m.emissive = new Color('#3ad8ff')
      m.emissiveIntensity = 0.35
    } else if (variant === 'ghost') {
      m.transparent = true
      m.opacity = 0.12
      m.depthWrite = false
    }
    material = m
  }
  cache.set(key, material)
  return material
}
