import { useEffect, useRef } from 'react'
import { AudioEngine } from '../lib/audio/AudioEngine.js'
import { usePlayerStore } from '../store/usePlayerStore.js'

export function useAudioAnalyser(audioElementRef) {
  const engineRef = useRef(null)

  useEffect(() => {
    const audioEl = audioElementRef.current
    if (!audioEl) return undefined

    const engine = new AudioEngine(audioEl)
    // Открываем AudioContext наружу: анализ BPM и waveform декодирует файл
    // через decodeAudioData и должен использовать тот же контекст. Создавать
    // второй нельзя — браузеры ограничивают их количество на страницу.
    audioEl.__matplayerContext = engine.context
    engineRef.current = engine
    let rafId

    const tick = () => {
      usePlayerStore.getState().setAudioBands(engine.getFrequencyBands())
      usePlayerStore.getState().setTime(audioEl.currentTime)
      rafId = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(rafId)
      delete audioEl.__matplayerContext
      engine.dispose()
      engineRef.current = null
    }
  }, [audioElementRef])

  return engineRef
}
