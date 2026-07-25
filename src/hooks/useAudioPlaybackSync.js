import { useEffect } from 'react'
import { usePlayerStore } from '../store/usePlayerStore.js'

export function useAudioPlaybackSync(audioElementRef) {
  useEffect(() => {
    const audioEl = audioElementRef.current
    if (!audioEl) return undefined

    const handlePlay = () => usePlayerStore.getState().setPlaying(true)
    const handlePause = () => usePlayerStore.getState().setPlaying(false)

    audioEl.addEventListener('play', handlePlay)
    audioEl.addEventListener('pause', handlePause)
    // По спецификации HTML достижение конца ресурса выставляет paused = true,
    // но события 'pause' НЕ поднимает. Без этой подписки isPlaying залипает
    // в true, и кнопка продолжает показывать «Pause» при тишине — нажатие
    // на неё вызывает play() и перезапускает трек с начала.
    audioEl.addEventListener('ended', handlePause)

    return () => {
      audioEl.removeEventListener('play', handlePlay)
      audioEl.removeEventListener('pause', handlePause)
      audioEl.removeEventListener('ended', handlePause)
    }
  }, [audioElementRef])
}
