import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Atlas } from './three/Atlas.jsx'
import { PerformanceManager } from './hooks/usePerformanceDegradation.js'
import { UXModeManager } from './ui/UXModeManager.jsx'
import { PlayerControls } from './ui/PlayerControls.jsx'
import { LyricsOverlay } from './ui/LyricsOverlay.jsx'
import { useAudioAnalyser } from './hooks/useAudioAnalyser.js'
import { useAudioPlaybackSync } from './hooks/useAudioPlaybackSync.js'
import { useSwipeGestures } from './hooks/useSwipeGestures.js'
import { useReducedMotion } from './hooks/useReducedMotion.js'
import { computePortraitCameraAdjustment } from './three/portraitAdaptation.js'
import { usePlayerStore } from './store/usePlayerStore.js'

import cupsize from './data/artists/cupsize.json'
import placeholderA from './data/artists/placeholder-a.json'
import placeholderB from './data/artists/placeholder-b.json'
import cupsizeZppp from './data/tracks/cupsize/cupsize_zppp.json'
import placeholderATrack from './data/tracks/placeholder-a/track-01.json'
import placeholderBTrack from './data/tracks/placeholder-b/track-01.json'
import cupsizeZpppLyrics from './data/lyrics/cupsize/track-10.json'
import placeholderALyrics from './data/lyrics/placeholder-a/track-01.json'
import placeholderBLyrics from './data/lyrics/placeholder-b/track-01.json'

const ARTISTS = [cupsize, placeholderA, placeholderB]
const TRACK_BY_ARTIST_ID = {
  cupsize: cupsizeZppp,
  placeholder_a: placeholderATrack,
  placeholder_b: placeholderBTrack,
}
const LYRICS_BY_ARTIST_ID = {
  cupsize: cupsizeZpppLyrics.lines,
  placeholder_a: placeholderALyrics.lines,
  placeholder_b: placeholderBLyrics.lines,
}

const BASE_CAMERA_POSITION = { x: 0, y: 1, z: 5 }
const SEEK_SECONDS = 5
const VOLUME_STEP = 0.1

function switchArtist(direction) {
  const ids = ARTISTS.map((a) => a.artist_id)
  const currentIndex = ids.indexOf(usePlayerStore.getState().currentArtistId)
  const nextIndex = (currentIndex + direction + ids.length) % ids.length
  usePlayerStore.getState().setArtist(ids[nextIndex])
}

export default function App() {
  const audioRef = useRef(null)
  const currentArtistId = usePlayerStore((s) => s.currentArtistId)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const reducedMotion = useReducedMotion()
  const [cameraPosition, setCameraPosition] = useState(BASE_CAMERA_POSITION)
  useAudioAnalyser(audioRef)
  useAudioPlaybackSync(audioRef)

  useEffect(() => {
    usePlayerStore.getState().setArtist('cupsize')
  }, [])

  useEffect(() => {
    function updateCamera() {
      setCameraPosition(
        computePortraitCameraAdjustment(BASE_CAMERA_POSITION, window.innerWidth, window.innerHeight),
      )
    }
    updateCamera()
    window.addEventListener('resize', updateCamera)
    return () => window.removeEventListener('resize', updateCamera)
  }, [])

  useEffect(() => {
    function handleKeyDown(event) {
      const audioEl = audioRef.current
      if (event.key === 'n') {
        switchArtist(1)
      } else if (event.key === ' ') {
        event.preventDefault()
        if (!audioEl) return
        if (audioEl.paused) audioEl.play()
        else audioEl.pause()
      } else if (event.key === 'ArrowRight') {
        if (audioEl) audioEl.currentTime += SEEK_SECONDS
      } else if (event.key === 'ArrowLeft') {
        if (audioEl) audioEl.currentTime = Math.max(0, audioEl.currentTime - SEEK_SECONDS)
      } else if (event.key === 'ArrowUp') {
        if (audioEl) audioEl.volume = Math.min(1, audioEl.volume + VOLUME_STEP)
      } else if (event.key === 'ArrowDown') {
        if (audioEl) audioEl.volume = Math.max(0, audioEl.volume - VOLUME_STEP)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useSwipeGestures({
    onSwipeLeft: () => switchArtist(1),
    onSwipeRight: () => switchArtist(-1),
    onDoubleTap: () => {
      const audioEl = audioRef.current
      if (!audioEl) return
      if (audioEl.paused) audioEl.play()
      else audioEl.pause()
    },
  })

  const activeTrack = TRACK_BY_ARTIST_ID[currentArtistId] ?? cupsizeZppp
  const activeLyrics = LYRICS_BY_ARTIST_ID[currentArtistId] ?? LYRICS_BY_ARTIST_ID.cupsize
  const activeArtistName = ARTISTS.find((a) => a.artist_id === currentArtistId)?.name ?? 'Cupsize'

  return (
    <div id="matplayer-root">
      {/* Hidden test hook — lets the Playwright smoke test observe the current artist
          without reaching into React/Zustand internals. Not user-facing UI. */}
      <div data-testid="current-artist" data-artist-id={currentArtistId ?? ''} hidden />
      <UXModeManager />
      <audio
        ref={audioRef}
        src={`${import.meta.env.BASE_URL}audio/${activeTrack.audio_src}`}
        autoPlay
        loop
        crossOrigin="anonymous"
      />
      <Canvas
        camera={{ position: [cameraPosition.x, cameraPosition.y, cameraPosition.z], fov: 50 }}
        onCreated={() => {
          document.documentElement.dataset.matplayerReady = 'true'
        }}
      >
        <PerformanceManager />
        <Atlas artists={ARTISTS} trackByArtistId={TRACK_BY_ARTIST_ID} />
      </Canvas>
      <LyricsOverlay lines={activeLyrics} reducedMotion={reducedMotion} />
      <PlayerControls
        artistName={activeArtistName}
        isPlaying={isPlaying}
        onTogglePlay={() => {
          const audioEl = audioRef.current
          if (!audioEl) return
          if (audioEl.paused) audioEl.play()
          else audioEl.pause()
        }}
        onNextArtist={() => switchArtist(1)}
      />
    </div>
  )
}
