import { Component, Suspense, useRef, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Center, ContactShadows, Environment, Html, Lightformer, OrbitControls, Resize, useGLTF } from '@react-three/drei'
import type { Group } from 'three'
import type { Candidate } from '../data/partTest.ts'
import { CanvasErrorBoundary } from './CanvasErrorBoundary.tsx'

const SPACING = 1.6

// One model that failed to load shouldn't hide the others.
class ModelErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? <Html center>Couldn’t load this model</Html> : this.props.children
  }
}

function Model({ url }: { url: string }) {
  // Draco off: our files use meshopt, and Draco would fetch its decoder from the internet.
  const { scene } = useGLTF(url, false, true)
  return <primitive object={scene} />
}

// Every candidate is resized to fit a 1-unit box so they can be compared fairly.
function Turntable({ candidate, x }: { candidate: Candidate; x: number }) {
  const spinner = useRef<Group>(null)
  useFrame((_, delta) => {
    if (spinner.current) spinner.current.rotation.y += delta * 0.3
  })

  return (
    <group position-x={x}>
      <group ref={spinner} position-y={0.5}>
        <ModelErrorBoundary>
          <Suspense fallback={<Html center>Loading…</Html>}>
            <Resize scale={1}>
              <Center>
                <Model url={candidate.model} />
              </Center>
            </Resize>
          </Suspense>
        </ModelErrorBoundary>
      </group>
      <Html position={[0, -0.15, 0]} center className="candidate-label">
        {candidate.tool}
      </Html>
    </group>
  )
}

// Studio light made from soft light panels: no HDRI download needed.
function StudioLighting() {
  return (
    <Environment resolution={256}>
      <Lightformer intensity={2} position={[0, 5, -2]} scale={[10, 2, 1]} />
      <Lightformer intensity={1.5} position={[-5, 2, 2]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} />
      <Lightformer intensity={1.5} position={[5, 2, 2]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
    </Environment>
  )
}

export default function PartTestViewer({ candidates }: { candidates: Candidate[] }) {
  const offset = ((candidates.length - 1) * SPACING) / 2

  return (
    <CanvasErrorBoundary>
      <Canvas camera={{ position: [0, 1.4, 3.2], fov: 45 }}>
        <color attach="background" args={['#0b1424']} />
        <StudioLighting />
        {candidates.map((candidate, i) => (
          <Turntable key={candidate.model} candidate={candidate} x={i * SPACING - offset} />
        ))}
        <ContactShadows position-y={0} opacity={0.5} scale={10} blur={2} far={2} />
        <OrbitControls target={[0, 0.5, 0]} enablePan={false} minDistance={1.5} maxDistance={8} />
      </Canvas>
    </CanvasErrorBoundary>
  )
}
