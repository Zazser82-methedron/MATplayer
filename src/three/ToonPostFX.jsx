import { memo } from 'react'
import { EffectComposer, Bloom, GodRays } from '@react-three/postprocessing'

function ToonPostFXImpl({
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

// GodRays из @react-three/postprocessing пересоздаёт эффект на КАЖДЫЙ рендер
// (внутри useMemo с зависимостью от объекта props, который React создаёт
// заново каждый раз) и монтирует его через <primitive dispose={null}> —
// то есть render targets выброшенного эффекта не освобождаются. Все пропсы
// здесь примитивы плюс стабильная ссылка на меш, поэтому memo надёжно
// отсекает лишние перерисовки и пересоздания остаются только при реальной
// смене трека.
export const ToonPostFX = memo(ToonPostFXImpl)
