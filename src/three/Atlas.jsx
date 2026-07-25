import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AvatarProxy } from './AvatarProxy.jsx'
import { ParticleField } from './ParticleField.jsx'
import { ToonPostFX } from './ToonPostFX.jsx'
import { computeCameraFlightPosition } from './cameraFlight.js'
import { usePlayerStore } from '../store/usePlayerStore.js'
import { useReducedMotion } from '../hooks/useReducedMotion.js'
import { isBloomEnabledAtLevel, isPostFxEnabledAtLevel } from '../hooks/performanceDegradation.js'

const FLIGHT_DURATION = 2.5

function ArtistIsland({ artist, isActive, track }) {
  const { x, y, z } = artist.atlas_position
  // Callback-ref через useState, а не useRef: useRef не вызывает ре-рендер
  // при появлении меша, и GodRays так и остался бы с sun={null} навсегда.
  const [sunMesh, setSunMesh] = useState(null)
  const degradationLevel = usePlayerStore((s) => s.degradationLevel)

  if (!isActive) {
    return (
      <mesh position={[x, y, z]} name={`island-marker-${artist.artist_id}`}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshBasicMaterial color={artist.default_palette.primary} />
      </mesh>
    )
  }

  // Ниже раннего return, потому что у неактивных островов track не передаётся.
  // Хуки обязаны идти до него, обычные вычисления — нет.
  const isMelancholic = track.mood.startsWith('melancholic')

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
      {/* Источник для God Rays: лучи расходятся от этого меша, поэтому он стоит
          позади аватара — так они пробиваются из-за силуэта. Он должен быть
          настоящим отрендеренным мешем, невидимый меш лучей не даёт — но
          рендерить его имеет смысл только когда лучи реально включены,
          иначе он торчит из-за головы аватара ярким шаром. */}
      {isMelancholic && (
        <mesh ref={setSunMesh} position={[0, 1.6, -3.5]} name="godrays-sun">
          <sphereGeometry args={[0.5, 24, 24]} />
          <meshBasicMaterial color={track.color_palette.secondary} />
        </mesh>
      )}
      <ToonPostFX
        bloomIntensity={track.shader_presets.bloom_intensity}
        moodIsMelancholic={isMelancholic}
        godRaysSource={sunMesh}
        bloomEnabled={isBloomEnabledAtLevel(degradationLevel)}
        postFxEnabled={isPostFxEnabledAtLevel(degradationLevel)}
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
