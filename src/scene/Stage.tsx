import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { PARTS } from '../data/parts.ts'
import { useCarStore } from '../state/carStore.ts'
import { CanvasErrorBoundary } from './CanvasErrorBoundary.tsx'
import { CarModel } from './CarModel.tsx'

const PART_NAMES = new Map(PARTS.map((p) => [p.id, p.name]))
const DEFAULT_CAMERA: [number, number, number] = [6.4, 2.5, 6.0]
/** Middle of the car, from the front wing tip to the rear crash structure. */
const CAR_CENTRE: [number, number, number] = [0.35, 0.35, 0]

/** Dev only: `?cam=x,y,z` sets the starting camera, so screenshots can be taken from fixed angles. */
function startingCamera(): [number, number, number] {
  if (!import.meta.env.DEV) return DEFAULT_CAMERA
  const parts = (new URLSearchParams(window.location.search).get('cam') ?? '').split(',').map(Number)
  if (parts.length !== 3 || !parts.every((n) => Number.isFinite(n) && Math.abs(n) < 50)) return DEFAULT_CAMERA
  return [parts[0], parts[1], parts[2]]
}

// Soft studio light panels: realistic reflections without downloading an HDRI.
function StudioLighting() {
  return (
    <Environment resolution={512}>
      <Lightformer intensity={4} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 4, 1]} />
      <Lightformer intensity={2} position={[-6, 2, 0]} rotation-y={Math.PI / 2} scale={[10, 2, 1]} />
      <Lightformer intensity={2} position={[6, 2, 0]} rotation-y={-Math.PI / 2} scale={[10, 2, 1]} />
      <Lightformer intensity={1.5} position={[0, 2, 6]} scale={[8, 2, 1]} />
      <Lightformer intensity={1.2} color="#9ec9ff" position={[0, 1, -6]} rotation-y={Math.PI} scale={[8, 2, 1]} />
    </Environment>
  )
}

function RealisticSet() {
  return (
    <>
      <color attach="background" args={['#1a212c']} />
      <fog attach="fog" args={['#1a212c', 10, 22]} />
      <StudioLighting />
      <directionalLight position={[4, 8, 5]} intensity={1.4} />
      <mesh rotation-x={-Math.PI / 2} position-y={-0.001} receiveShadow>
        <circleGeometry args={[12, 64]} />
        <meshStandardMaterial color="#232a35" roughness={0.85} />
      </mesh>
      <ContactShadows position-y={0.001} opacity={0.75} scale={9} blur={2.4} far={1.2} resolution={1024} frames={1} />
    </>
  )
}

// The Spider-Man suit-lab look: dark navy, glowing grid and pedestal ring.
function HologramSet() {
  return (
    <>
      <color attach="background" args={['#050b18']} />
      <gridHelper args={[24, 48, '#1f6bff', '#0d2244']} />
      <mesh rotation-x={-Math.PI / 2} position-y={0.002}>
        <ringGeometry args={[3.3, 3.36, 128]} />
        <meshBasicMaterial color="#3ad8ff" />
      </mesh>
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

  return (
    <CanvasErrorBoundary>
      <Canvas camera={{ position: startingCamera(), fov: 38 }} dpr={[1, 2]}>
        {viewMode === 'realistic' ? <RealisticSet /> : <HologramSet />}
        <CarModel />
        <OrbitControls target={CAR_CENTRE} enablePan={false} minDistance={2.5} maxDistance={12} maxPolarAngle={Math.PI / 2 - 0.05} />
      </Canvas>
      <ViewControls />
    </CanvasErrorBoundary>
  )
}
