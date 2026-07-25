import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { Atlas } from './three/Atlas.jsx'
import { PerformanceManager } from './hooks/usePerformanceDegradation.js'
import { UXModeManager } from './ui/UXModeManager.jsx'
import { PlayerControls } from './ui/PlayerControls.jsx'
import { LyricsOverlay } from './ui/LyricsOverlay.jsx'
import { Library } from './ui/Library.jsx'
import { useAudioAnalyser } from './hooks/useAudioAnalyser.js'
import { useAudioPlaybackSync } from './hooks/useAudioPlaybackSync.js'
import { useSwipeGestures } from './hooks/useSwipeGestures.js'
import { useReducedMotion } from './hooks/useReducedMotion.js'
import { computePortraitCameraAdjustment } from './three/portraitAdaptation.js'
import { usePlayerStore } from './store/usePlayerStore.js'
import { ARTISTS, TRACKS_BY_ID, resolveLyrics } from './data/index.js'
import { buildLibraryEntries } from './lib/library/buildLibrary.js'
import { pickReadableTextColor } from './lib/color/contrast.js'

const DEFAULT_ARTIST_ID = 'cupsize'
const DEFAULT_TRACK_ID = 'cupsize_zppp'
const BASE_CAMERA_POSITION = { x: 0, y: 1, z: 5 }
const SEEK_SECONDS = 5
const VOLUME_STEP = 0.1

function findArtist(artistId) {
  return ARTISTS.find((a) => a.artist_id === artistId) ?? ARTISTS.find((a) => a.artist_id === DEFAULT_ARTIST_ID)
}

function switchArtist(direction) {
  const ids = ARTISTS.map((a) => a.artist_id)
  const currentIndex = ids.indexOf(usePlayerStore.getState().currentArtistId)
  const nextIndex = (currentIndex + direction + ids.length) % ids.length
  const nextArtist = ARTISTS[nextIndex]
  usePlayerStore.getState().setArtist(nextArtist.artist_id)
  usePlayerStore.getState().setTrack(nextArtist.track_ids[0])
}

function switchTrack(direction) {
  const store = usePlayerStore.getState()
  const artist = findArtist(store.currentArtistId)
  const ids = artist.track_ids
  const currentIndex = ids.indexOf(store.currentTrackId)
  const nextIndex = (currentIndex + direction + ids.length) % ids.length
  store.setTrack(ids[nextIndex])
}

function selectTrack(artistId, trackId) {
  const store = usePlayerStore.getState()
  store.setArtist(artistId)
  store.setTrack(trackId)
}

export default function App() {
  const audioRef = useRef(null)
  const currentArtistId = usePlayerStore((s) => s.currentArtistId)
  const currentTrackId = usePlayerStore((s) => s.currentTrackId)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const reducedMotion = useReducedMotion()
  const [cameraPosition, setCameraPosition] = useState(BASE_CAMERA_POSITION)
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  useAudioAnalyser(audioRef)
  useAudioPlaybackSync(audioRef)

  const libraryEntries = useMemo(() => buildLibraryEntries(ARTISTS, TRACKS_BY_ID), [])

  useEffect(() => {
    usePlayerStore.getState().setArtist(DEFAULT_ARTIST_ID)
    usePlayerStore.getState().setTrack(DEFAULT_TRACK_ID)
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

  const activeArtist = findArtist(currentArtistId)
  const activeTrack = TRACKS_BY_ID[currentTrackId] ?? TRACKS_BY_ID[DEFAULT_TRACK_ID]
  const activeLyrics = resolveLyrics(activeTrack.lyrics_ref)
  const trackByArtistId = { [activeArtist.artist_id]: activeTrack }

  // Auto-advance to the next track when one ends, instead of looping the
  // same track forever — matches expected library/player behaviour.
  useEffect(() => {
    const audioEl = audioRef.current
    if (!audioEl) return undefined
    const handleEnded = () => switchTrack(1)
    audioEl.addEventListener('ended', handleEnded)
    return () => audioEl.removeEventListener('ended', handleEnded)
  }, [])

  // Changing the `src` attribute on an existing <audio> element doesn't make
  // the browser pick it up on its own — it needs an explicit reload. By the
  // time a track switch happens the user has already interacted with the
  // page, so autoplay restrictions won't block the resulting play() call.
  useEffect(() => {
    const audioEl = audioRef.current
    if (!audioEl) return
    audioEl.load()
    audioEl.play().catch(() => {})
  }, [activeTrack.audio_src])

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
        crossOrigin="anonymous"
      />
      <Canvas
        camera={{ position: [cameraPosition.x, cameraPosition.y, cameraPosition.z], fov: 50 }}
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
        onCreated={() => {
          document.documentElement.dataset.matplayerReady = 'true'
        }}
      >
        <PerformanceManager />
        <Atlas artists={ARTISTS} trackByArtistId={trackByArtistId} />
      </Canvas>
      <LyricsOverlay
        lines={activeLyrics}
        reducedMotion={reducedMotion}
        textColor={pickReadableTextColor(activeTrack.color_palette.background)}
      />
      <PlayerControls
        artistName={activeArtist.name}
        trackTitle={activeTrack.title ?? ''}
        isPlaying={isPlaying}
        onTogglePlay={() => {
          const audioEl = audioRef.current
          if (!audioEl) return
          if (audioEl.paused) audioEl.play()
          else audioEl.pause()
        }}
        onNextArtist={() => switchArtist(1)}
        onPrevTrack={() => switchTrack(-1)}
        onNextTrack={() => switchTrack(1)}
        isLibraryOpen={isLibraryOpen}
        onToggleLibrary={() => setIsLibraryOpen((open) => !open)}
      />
      <Library
        entries={libraryEntries}
        activeArtistId={activeArtist.artist_id}
        activeTrackId={activeTrack.track_id}
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectTrack={(artistId, trackId) => {
          selectTrack(artistId, trackId)
          setIsLibraryOpen(false)
        }}
      />
    </div>
  )
}
