import { EffectComposer, Bloom, GodRays } from '@react-three/postprocessing'

export function ToonPostFX({ bloomIntensity = 1.2, godRaysSource = null, moodIsMelancholic = false }) {
  return (
    <EffectComposer>
      <Bloom intensity={bloomIntensity} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur />
      {moodIsMelancholic && godRaysSource && (
        <GodRays sun={godRaysSource} exposure={0.34} decay={0.9} blur />
      )}
    </EffectComposer>
  )
}
