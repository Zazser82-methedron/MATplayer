import { Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { AvatarProxy } from './AvatarProxy.jsx'
import { ParticleField } from './ParticleField.jsx'
import { ToonPostFX } from './ToonPostFX.jsx'
import { useAudioAnalyser } from '../hooks/useAudioAnalyser.js'
import { usePlayerStore } from '../store/usePlayerStore.js'

function SceneContents({ track }) {
  const isMelancholic = track.mood.startsWith('melancholic')

  return (
    <>
      <fogExp2 attach="fog" args={[track.color_palette.background, 0.08]} />
      <color attach="background" args={[track.color_palette.background]} />
      <ambientLight intensity={0.6} />
      <pointLight position={[3, 3, 3]} intensity={1.2} />
      <AvatarProxy
        palette={track.color_palette}
        energy={track.energy}
        outlineThickness={track.shader_presets.outline_thickness}
      />
      <ParticleField palette={track.color_palette} />
      <ToonPostFX bloomIntensity={track.shader_presets.bloom_intensity} moodIsMelancholic={isMelancholic} />
    </>
  )
}

export function ArtistScene({ artist, track, audioElementRef }) {
  useAudioAnalyser(audioElementRef)

  useEffect(() => {
    usePlayerStore.getState().setArtist(artist.artist_id)
    usePlayerStore.getState().setTrack(track.track_id)
  }, [artist, track])

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      onCreated={() => {
        document.documentElement.dataset.matplayerReady = 'true'
      }}
    >
      <Suspense fallback={null}>
        <SceneContents track={track} />
      </Suspense>
    </Canvas>
  )
}
