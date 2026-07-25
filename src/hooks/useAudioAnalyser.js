import { useEffect, useRef } from 'react'
import { AudioEngine } from '../lib/audio/AudioEngine.js'
import { usePlayerStore } from '../store/usePlayerStore.js'

export function useAudioAnalyser(audioElementRef) {
  const engineRef = useRef(null)

  useEffect(() => {
    const audioEl = audioElementRef.current
    if (!audioEl) return undefined

    const engine = new AudioEngine(audioEl)
    engineRef.current = engine
    let rafId

    const tick = () => {
      usePlayerStore.getState().setAudioBands(engine.getFrequencyBands())
      rafId = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(rafId)
      engine.dispose()
      engineRef.current = null
    }
  }, [audioElementRef])

  return engineRef
}
