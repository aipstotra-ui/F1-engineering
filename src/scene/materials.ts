// Every material the car uses, in three looks: realistic, hologram, and highlighted/ghosted variants.
// Materials are created once and shared (see src/scene/CLAUDE.md); never create one per render.
import { AdditiveBlending, Color, DoubleSide, MeshPhysicalMaterial, ShaderMaterial, Vector2, type Material } from 'three'
import type { MaterialKind } from '../parts/rb19/index.ts'
import type { ViewMode } from '../state/carStore.ts'
import { carbonColour, carbonNormal, radiatorFins, surfaceNoise } from './textures.ts'
export type Variant = 'normal' | 'highlight' | 'ghost'

/** RB19-style colours without logos (docs/design.md). */
const NAVY = '#161c32' // the RB19's very dark, satin navy
const RED = '#d8202f'
const YELLOW = '#f0b000' // golden, like the RB19's nose and airbox (F-047)

function realistic(kind: MaterialKind): MeshPhysicalMaterial {
  const base = { side: DoubleSide }
  switch (kind) {
    case 'paint':
    case 'paintRed':
    case 'paintYellow': {
      // Satin paint: a little uneven roughness under a clear coat, like a real painted panel.
      const colour = kind === 'paint' ? NAVY : kind === 'paintRed' ? RED : YELLOW
      return new MeshPhysicalMaterial({
        ...base,
        color: colour,
        roughness: 0.5,
        roughnessMap: surfaceNoise(11, 3, 200, 255, 10) ?? undefined,
        metalness: kind === 'paint' ? 0.25 : 0.05,
        clearcoat: 0.65,
        clearcoatRoughness: 0.22,
      })
    }
    case 'carbon':
    case 'carbonMatte': {
      const gloss = kind === 'carbon'
      return new MeshPhysicalMaterial({
        ...base,
        map: carbonColour() ?? undefined,
        normalMap: carbonNormal() ?? undefined,
        normalScale: gloss ? new Vector2(0.5, 0.5) : new Vector2(0.3, 0.3),
        roughness: gloss ? 0.32 : 0.7,
        metalness: gloss ? 0.15 : 0.05,
        color: gloss ? '#ffffff' : '#8a8a8a',
        clearcoat: gloss ? 1 : 0.1,
        clearcoatRoughness: 0.08,
      })
    }
    case 'rubber':
      // Slick tyre rubber: dark, slightly uneven, with a soft sheen from scuffing.
      return new MeshPhysicalMaterial({
        ...base,
        color: '#161616',
        roughness: 0.85,
        roughnessMap: surfaceNoise(23, 8, 215, 255, 8) ?? undefined,
        metalness: 0,
        sheen: 0.25,
        sheenRoughness: 0.6,
        sheenColor: '#4a4a4a',
      })
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
      return new MeshPhysicalMaterial({ ...base, color: '#2d2d2f', roughness: 0.9, roughnessMap: surfaceNoise(37, 20, 170, 255, 60) ?? undefined, metalness: 0.1 })
    case 'radiator':
      return new MeshPhysicalMaterial({ ...base, color: '#ffffff', map: radiatorFins() ?? undefined, roughness: 0.5, metalness: 0.7 })
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
