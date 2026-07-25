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

    return () => {
      audioEl.removeEventListener('play', handlePlay)
      audioEl.removeEventListener('pause', handlePause)
    }
  }, [audioElementRef])
}
