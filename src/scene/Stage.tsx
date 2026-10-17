import { memo, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { PARTS } from '../data/parts.ts'
import { useCarStore } from '../state/carStore.ts'
import { CanvasErrorBoundary } from './CanvasErrorBoundary.tsx'
import { CarModel } from './CarModel.tsx'
import { Effects } from './Effects.tsx'

const PART_NAMES = new Map(PARTS.map((p) => [p.id, p.name]))
const DEFAULT_CAMERA: [number, number, number] = [6.4, 2.5, 6.0]
/** Middle of the car, from the front wing tip to the rear crash structure. */
const CAR_CENTRE: [number, number, number] = [0.35, 0.35, 0]

/** Dev only: `?cam=x,y,z` sets the starting camera, so screenshots can be taken from fixed angles. */
function startingCamera(): [number, number, number] {
  if (!import.meta.env.DEV) return DEFAULT_CAMERA
  const parts = (new URLSearchParams(window.location.search).get('cam') ?? '').split(',').map(Number)
  const raw = (new URLSearchParams(window.location.search).get('cam') ?? '').split(',')
  if (raw.length !== 3 || raw.some((part) => part.trim() === '')) return DEFAULT_CAMERA
  if (!parts.every((n) => Number.isFinite(n) && Math.abs(n) < 50)) return DEFAULT_CAMERA
  return [parts[0], parts[1], parts[2]]
}

// Soft studio light panels: realistic reflections without downloading an HDRI.
// memo: it has no props, so switching view modes never re-bakes the lighting.
const StudioLighting = memo(function StudioLighting() {
  return (
    <Environment resolution={256}>
      {/* Dim grey studio walls, so reflections have something darker than the lights to show. */}
      <color attach="background" args={['#3a404b']} />
      {/* Big overhead softbox: the main light and the long highlight along the bodywork. */}
      <Lightformer form="rect" intensity={5} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[10, 3, 1]} />
      {/* Thin light strips on both sides: the crisp reflection lines seen on car photos. */}
      {[-1.5, 0, 1.5].map((x) => (
        <Lightformer key={x} form="rect" intensity={3.5} position={[x * 2, 2.2, 5]} scale={[0.35, 6, 1]} />
      ))}
      {[-1.5, 0, 1.5].map((x) => (
        <Lightformer key={x} form="rect" intensity={3.5} position={[x * 2, 2.2, -5]} rotation-y={Math.PI} scale={[0.35, 6, 1]} />
      ))}
      {/* Warm key from the front, cool rim from behind. */}
      <Lightformer form="rect" intensity={3} color="#ffe2c4" position={[7, 2, 0]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} />
      <Lightformer form="rect" intensity={1.6} color="#b8d4ff" position={[-7, 2.5, 0]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
      {/* Floor bounce. */}
      <Lightformer form="rect" intensity={0.4} position={[0, -1, 0]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} />
    </Environment>
  )
})

/** Baked once: the car doesn't move, so the soft shadow under it never needs redrawing. */
const BakedShadow = memo(function BakedShadow() {
  return <ContactShadows position-y={0.001} opacity={0.75} scale={9} blur={2.4} far={1.2} resolution={1024} frames={1} />
})

// Lighting and the baked shadow stay mounted in both modes (hidden in hologram mode):
// unmounting them would rebuild them on every switch and leak the shadow's GPU memory.
function RealisticSet({ visible }: { visible: boolean }) {
  return (
    <>
      <StudioLighting />
      <group visible={visible}>
        <directionalLight position={[4, 8, 5]} intensity={1.8} />
        <hemisphereLight args={['#dfe8ff', '#1d222b', 0.35]} />
        <mesh rotation-x={-Math.PI / 2} position-y={-0.001}>
          <circleGeometry args={[12, 64]} />
          <meshStandardMaterial color="#1d222b" roughness={0.8} />
        </mesh>
        <BakedShadow />
      </group>
    </>
  )
}

// The Spider-Man suit-lab look: dark navy, glowing grid and pedestal ring.
function HologramSet({ visible }: { visible: boolean }) {
  return (
    <>
      <group visible={visible}>
        <gridHelper args={[24, 48, '#1f6bff', '#0d2244']} />
        <mesh rotation-x={-Math.PI / 2} position-y={0.002}>
          <ringGeometry args={[3.3, 3.36, 128]} />
          <meshBasicMaterial color="#3ad8ff" />
        </mesh>
      </group>
    </>
  )
}

function ViewControls() {
  const viewMode = useCarStore((s) => s.viewMode)
  const xray = useCarStore((s) => s.xray)
  const setViewMode = useCarStore((s) => s.setViewMode)
  const toggleXray = useCarStore((s) => s.toggleXray)
  const hovered = useCarStore((s) => s.hoveredPartId)
  const selected = useCarStore((s) => s.selectedPartId)
  const label = hovered ?? selected

  // Pointer cursor while hovering a part.
  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto'
    return () => {
      document.body.style.cursor = 'auto'
    }
  }, [hovered])

  return (
    <div className="stage-controls">
      <div className="stage-buttons" role="group" aria-label="View">
        <button aria-pressed={viewMode === 'realistic'} onClick={() => setViewMode('realistic')}>
          Realistic
        </button>
        <button aria-pressed={viewMode === 'hologram'} onClick={() => setViewMode('hologram')}>
          Hologram
        </button>
        <button aria-pressed={xray} onClick={toggleXray} title="See through the bodywork to the internals">
          X-ray
        </button>
      </div>
      <p className="stage-hint">
        {label ? PART_NAMES.get(label) : 'Drag to rotate · scroll to zoom · click a part to learn about it'}
      </p>
    </div>
  )
}

export default function Stage() {
  const viewMode = useCarStore((s) => s.viewMode)
  const [camera] = useState(() => ({ position: startingCamera(), fov: 38 }))

  return (
    <CanvasErrorBoundary>
      {/* "demand": the scene only redraws when something changes, so an idle page costs no GPU. */}
      <Canvas camera={camera} dpr={[1, 2]} frameloop="demand">
        {/* One background and fog for both modes, so switching can never leave the wrong one behind. */}
        <color attach="background" args={[viewMode === 'realistic' ? '#222a37' : '#050b18']} />
        <fog attach="fog" args={viewMode === 'realistic' ? ['#222a37', 12, 26] : ['#050b18', 30, 40]} />
        <RealisticSet visible={viewMode === 'realistic'} />
        <HologramSet visible={viewMode === 'hologram'} />
        <CarModel />
        <Effects mode={viewMode} />
        <OrbitControls target={CAR_CENTRE} enablePan={false} minDistance={2.5} maxDistance={12} maxPolarAngle={Math.PI / 2 - 0.05} />
      </Canvas>
      <ViewControls />
    </CanvasErrorBoundary>
  )
}
