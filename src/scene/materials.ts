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
  type Material,
} from 'three'
import type { MaterialKind } from '../parts/rb19/index.ts'

export type ViewMode = 'realistic' | 'hologram'
export type Variant = 'normal' | 'highlight' | 'ghost'

/** RB19-style colours without logos (docs/design.md). */
const NAVY = '#1c2a4f'
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

let carbonMap: CanvasTexture | null | undefined

function realistic(kind: MaterialKind): MeshPhysicalMaterial {
  const base = { side: DoubleSide }
  switch (kind) {
    case 'paint':
      return new MeshPhysicalMaterial({ ...base, color: NAVY, roughness: 0.55, metalness: 0.1, clearcoat: 0.3, clearcoatRoughness: 0.5 })
    case 'paintRed':
      return new MeshPhysicalMaterial({ ...base, color: RED, roughness: 0.45, clearcoat: 0.4 })
    case 'paintYellow':
      return new MeshPhysicalMaterial({ ...base, color: YELLOW, roughness: 0.45, clearcoat: 0.4 })
    case 'carbon':
    case 'carbonMatte': {
      if (carbonMap === undefined) carbonMap = carbonTexture()
      const gloss = kind === 'carbon'
      return new MeshPhysicalMaterial({
        ...base,
        map: carbonMap ?? undefined,
        roughness: gloss ? 0.35 : 0.75,
        metalness: gloss ? 0.2 : 0.05,
        color: gloss ? '#ffffff' : '#9a9a9a',
        clearcoat: gloss ? 0.9 : 0.05,
        clearcoatRoughness: 0.15,
      })
    }
    case 'rubber':
      return new MeshPhysicalMaterial({ ...base, color: '#141414', roughness: 0.92, metalness: 0 })
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
      }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
  })
}

const cache = new Map<string, Material>()

/** The shared material for a part's piece in the current view. */
export function getMaterial(kind: MaterialKind, mode: ViewMode, variant: Variant): Material {
  const key = `${kind}|${mode}|${variant}`
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
