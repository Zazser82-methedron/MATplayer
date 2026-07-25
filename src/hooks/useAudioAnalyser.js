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

    // Контекст стартует в состоянии suspended, пока не было жеста
    // пользователя. Всё воспроизведение маршрутизировано через него, поэтому
    // до resume() звука нет, а анализатор отдаёт нули. Пробуем возобновить
    // на первом же взаимодействии — после успеха подписки снимаем.
    const resumeOnGesture = () => {
      engine.resume()
      if (engine.context.state === 'running') detachGestureListeners()
    }
    const GESTURE_EVENTS = ['pointerdown', 'keydown', 'touchstart']
    const detachGestureListeners = () => {
      GESTURE_EVENTS.forEach((name) => window.removeEventListener(name, resumeOnGesture))
    }
    GESTURE_EVENTS.forEach((name) => window.addEventListener(name, resumeOnGesture))

    return () => {
      cancelAnimationFrame(rafId)
      detachGestureListeners()
      delete audioEl.__matplayerContext
      engine.dispose()
      engineRef.current = null
    }
  }, [audioElementRef])

  return engineRef
}
