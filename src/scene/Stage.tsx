import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { Mesh } from 'three'

// Placeholder pedestal: proves the 3D setup works. Replaced by the studio scene in Step 5.
function Pedestal() {
  const ring = useRef<Mesh>(null)

  useFrame((_, delta) => {
    if (ring.current) ring.current.rotation.z += delta * 0.4
  })

  return (
    <group>
      <mesh>
        <cylinderGeometry args={[2, 2, 0.08, 64]} />
        <meshStandardMaterial color="#0b1a33" />
      </mesh>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.06}>
        <torusGeometry args={[2.1, 0.03, 16, 128]} />
        <meshBasicMaterial color="#3ad8ff" />
      </mesh>
    </group>
  )
}

export function Stage() {
  return (
    <Canvas camera={{ position: [4, 3, 5], fov: 45 }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} />
      <Pedestal />
      <gridHelper args={[20, 40, '#1f6bff', '#0d2244']} />
      <OrbitControls enablePan={false} minDistance={3} maxDistance={12} />
    </Canvas>
  )
}
