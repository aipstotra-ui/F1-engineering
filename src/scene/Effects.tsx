import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import type { ViewMode } from '../state/carStore.ts'

// Screen effects that make the render read as a photo rather than clay:
// - N8AO: ambient occlusion, the soft darkening where parts meet and in creases.
// - Bloom: a gentle glow on the brightest reflections (much stronger in hologram mode).
// - SMAA: smooth edges. ToneMapping: filmic colour response, as a camera would capture it.
export function Effects({ mode }: { mode: ViewMode }) {
  if (mode === 'hologram') {
    return (
      <EffectComposer multisampling={0}>
        <Bloom intensity={1.4} luminanceThreshold={0.15} luminanceSmoothing={0.4} mipmapBlur />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <SMAA />
      </EffectComposer>
    )
  }
  return (
    <EffectComposer multisampling={0}>
      <N8AO aoRadius={0.35} distanceFalloff={0.6} intensity={2.2} halfRes />
      <Bloom intensity={0.25} luminanceThreshold={0.92} luminanceSmoothing={0.2} mipmapBlur />
      {/* Neutral keeps the livery's true colours (AgX washed the yellow out). */}
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <SMAA />
    </EffectComposer>
  )
}
