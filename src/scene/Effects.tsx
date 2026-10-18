import { useLayoutEffect, useRef } from 'react'
import { Bloom, BrightnessContrast, EffectComposer, HueSaturation, N8AO, SMAA, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import type { ViewMode } from '../state/carStore.ts'

/** The part of N8AO's settings we change (the library's own type isn't exported by the wrapper). */
interface AoPass {
  configuration: { transparencyAware: boolean }
}

// Screen effects that make the render read as a photo rather than clay:
// - N8AO: ambient occlusion, the soft darkening where parts meet and in creases.
// - Bloom: a gentle glow on the brightest reflections (much stronger in hologram mode).
// - Colour grade: a little extra saturation and contrast, like a photographer's edit.
// - ToneMapping: filmic colour response. SMAA: smooth edges.
// One set of effects serves both modes (switching only changes settings), so nothing is rebuilt
// or leaked when you toggle.
export function Effects({ mode }: { mode: ViewMode }) {
  const realistic = mode === 'realistic'
  const ao = useRef<AoPass>(null)

  // The baked ground shadow is a transparent plane; without this N8AO would pay for
  // transparency handling on every frame just because that plane exists.
  useLayoutEffect(() => {
    if (ao.current) ao.current.configuration.transparencyAware = false
  }, [])

  return (
    <EffectComposer multisampling={0}>
      <N8AO
        ref={ao}
        enabled={realistic}
        aoRadius={0.35}
        distanceFalloff={0.6}
        intensity={2.4}
        quality="high"
        halfRes={false}
      />
      <Bloom
        intensity={realistic ? 0.3 : 1.4}
        luminanceThreshold={realistic ? 0.9 : 0.15}
        luminanceSmoothing={realistic ? 0.2 : 0.4}
        mipmapBlur
      />
      <HueSaturation saturation={realistic ? 0.06 : 0} />
      <BrightnessContrast contrast={realistic ? 0.08 : 0} />
      {/* Neutral keeps the livery's true colours; ACES gives the hologram its punchy glow. */}
      <ToneMapping mode={realistic ? ToneMappingMode.NEUTRAL : ToneMappingMode.ACES_FILMIC} />
      <SMAA />
    </EffectComposer>
  )
}
