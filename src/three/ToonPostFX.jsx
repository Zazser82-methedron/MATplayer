import { EffectComposer, Bloom, GodRays } from '@react-three/postprocessing'

export function ToonPostFX({
  bloomIntensity = 1.2,
  godRaysSource = null,
  moodIsMelancholic = false,
  bloomEnabled = true,
  postFxEnabled = true,
}) {
  // На нижних ступенях деградации весь пост-процессинг снимается целиком:
  // пустой EffectComposer всё равно стоит одного полноэкранного прохода,
  // поэтому дешевле не монтировать его вовсе.
  if (!postFxEnabled) return null

  const godRaysActive = moodIsMelancholic && Boolean(godRaysSource)

  return (
    // GodRays читает буфер глубины, и MSAA-резолв композитора пытается
    // блитить его сам в себя — драйвер каждый кадр отдаёт GL_INVALID_OPERATION
    // («read and write depth stencil attachments cannot be the same image»).
    // Гасим multisampling только когда лучи реально включены: терять
    // сглаживание на всех остальных треках незачем.
    <EffectComposer multisampling={godRaysActive ? 0 : 8}>
      {bloomEnabled && (
        <Bloom
          intensity={bloomIntensity}
          luminanceThreshold={0.82}
          luminanceSmoothing={0.18}
          mipmapBlur
        />
      )}
      {moodIsMelancholic && godRaysSource && (
        <GodRays sun={godRaysSource} exposure={0.34} decay={0.9} blur />
      )}
    </EffectComposer>
  )
}
