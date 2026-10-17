import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { Group } from 'three'
import { CanvasErrorBoundary } from './CanvasErrorBoundary.tsx'

const MARKER_ANGLES = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3]

// Placeholder pedestal: proves the 3D setup works. Replaced by the studio scene in Step 5.
function Pedestal() {
  const turntable = useRef<Group>(null)

  useFrame((_, delta) => {
    if (turntable.current) turntable.current.rotation.y += delta * 0.4
  })

  return (
    <group ref={turntable}>
      <mesh>
        <cylinderGeometry args={[2, 2, 0.08, 64]} />
        <meshStandardMaterial color="#0b1a33" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.06}>
        <torusGeometry args={[2.1, 0.03, 16, 128]} />
        <meshBasicMaterial color="#3ad8ff" />
      </mesh>
      {/* Three glowing markers on the ring make the rotation visible. */}
      {MARKER_ANGLES.map((angle) => (
        <mesh key={angle} position={[Math.cos(angle) * 2.1, 0.08, Math.sin(angle) * 2.1]}>
          <boxGeometry args={[0.18, 0.06, 0.18]} />
          <meshBasicMaterial color="#3ad8ff" />
        </mesh>
      ))}
    </group>
  )
}

export default function Stage() {
  return (
    <CanvasErrorBoundary>
      <Canvas camera={{ position: [4, 3, 5], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} />
        <Pedestal />
        <gridHelper args={[20, 40, '#1f6bff', '#0d2244']} />
        <OrbitControls enablePan={false} minDistance={3} maxDistance={12} />
      </Canvas>
    </CanvasErrorBoundary>
  )
}
