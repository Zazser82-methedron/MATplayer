import { useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Atlas } from './three/Atlas.jsx'
import { usePlayerStore } from './store/usePlayerStore.js'
import { useAudioAnalyser } from './hooks/useAudioAnalyser.js'

import cupsize from './data/artists/cupsize.json'
import placeholderA from './data/artists/placeholder-a.json'
import placeholderB from './data/artists/placeholder-b.json'
import cupsizeZppp from './data/tracks/cupsize/cupsize_zppp.json'
import placeholderATrack from './data/tracks/placeholder-a/track-01.json'
import placeholderBTrack from './data/tracks/placeholder-b/track-01.json'

const ARTISTS = [cupsize, placeholderA, placeholderB]
const TRACK_BY_ARTIST_ID = {
  cupsize: cupsizeZppp,
  placeholder_a: placeholderATrack,
  placeholder_b: placeholderBTrack,
}

export default function App() {
  const audioRef = useRef(null)
  const currentArtistId = usePlayerStore((s) => s.currentArtistId)
  useAudioAnalyser(audioRef)

  useEffect(() => {
    usePlayerStore.getState().setArtist('cupsize')
  }, [])

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key !== 'ArrowRight' && event.key !== 'n') return
      const ids = ARTISTS.map((a) => a.artist_id)
      const currentIndex = ids.indexOf(usePlayerStore.getState().currentArtistId)
      const nextId = ids[(currentIndex + 1) % ids.length]
      usePlayerStore.getState().setArtist(nextId)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const activeTrack = TRACK_BY_ARTIST_ID[currentArtistId] ?? cupsizeZppp

  return (
    <div id="matplayer-root">
      {/* Hidden test hook — lets the Playwright smoke test observe the current artist
          without reaching into React/Zustand internals. Not user-facing UI. */}
      <div data-testid="current-artist" data-artist-id={currentArtistId ?? ''} hidden />
      <audio ref={audioRef} src={`/audio/${activeTrack.audio_src}`} autoPlay loop crossOrigin="anonymous" />
      <Canvas
        camera={{ position: [0, 1, 5], fov: 50 }}
        onCreated={() => {
          document.documentElement.dataset.matplayerReady = 'true'
        }}
      >
        <Atlas artists={ARTISTS} trackByArtistId={TRACK_BY_ARTIST_ID} />
      </Canvas>
    </div>
  )
}
