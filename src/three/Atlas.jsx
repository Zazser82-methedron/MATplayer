import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AvatarProxy } from './AvatarProxy.jsx'
import { ParticleField } from './ParticleField.jsx'
import { ToonPostFX } from './ToonPostFX.jsx'
import { computeCameraFlightPosition } from './cameraFlight.js'
import { usePlayerStore } from '../store/usePlayerStore.js'
import { useReducedMotion } from '../hooks/useReducedMotion.js'

const FLIGHT_DURATION = 2.5

function ArtistIsland({ artist, isActive, track }) {
  const { x, y, z } = artist.atlas_position

  if (!isActive) {
    return (
      <mesh position={[x, y, z]} name={`island-marker-${artist.artist_id}`}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshBasicMaterial color={artist.default_palette.primary} />
      </mesh>
    )
  }

  return (
    <group position={[x, y, z]} name={`island-active-${artist.artist_id}`}>
      <fogExp2 attach="fog" args={[track.color_palette.background, 0.08]} />
      <ambientLight intensity={0.6} />
      <pointLight position={[3, 3, 3]} intensity={1.2} />
      <AvatarProxy
        palette={track.color_palette}
        energy={track.energy}
        outlineThickness={track.shader_presets.outline_thickness}
      />
      <ParticleField palette={track.color_palette} noiseType={track.shader_presets.noise_type} />
      <ToonPostFX
        bloomIntensity={track.shader_presets.bloom_intensity}
        moodIsMelancholic={track.mood.startsWith('melancholic')}
      />
    </group>
  )
}

export function Atlas({ artists, trackByArtistId }) {
  const { camera } = useThree()
  const currentArtistId = usePlayerStore((s) => s.currentArtistId)
  const reducedMotion = useReducedMotion()
  const flightRef = useRef(null)

  useEffect(() => {
    const targetArtist = artists.find((a) => a.artist_id === currentArtistId) ?? artists[0]
    flightRef.current = {
      startPos: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
      endPos: {
        x: targetArtist.atlas_position.x,
        y: targetArtist.atlas_position.y + 1,
        z: targetArtist.atlas_position.z + 5,
      },
      lookAt: targetArtist.atlas_position,
      elapsed: 0,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentArtistId])

  useFrame((_, delta) => {
    const flight = flightRef.current
    if (!flight) return
    flight.elapsed += delta
    // Reduced motion: skip the eased Bezier flight and snap straight to the
    // end position by always feeding the "fully arrived" elapsed value.
    const elapsedForFlight = reducedMotion ? FLIGHT_DURATION : flight.elapsed
    const pos = computeCameraFlightPosition(elapsedForFlight, FLIGHT_DURATION, flight.startPos, flight.endPos)
    camera.position.set(pos.x, pos.y, pos.z)
    camera.lookAt(flight.lookAt.x, flight.lookAt.y, flight.lookAt.z)
  })

  return (
    <>
      {artists.map((artist) => (
        <ArtistIsland
          key={artist.artist_id}
          artist={artist}
          isActive={artist.artist_id === currentArtistId}
          track={trackByArtistId[artist.artist_id]}
        />
      ))}
    </>
  )
}
