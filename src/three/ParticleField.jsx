import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { vertexShader, fragmentShader } from './shaders/curlNoiseParticles.js'
import { computeAudioTimeStep, computeCurlAmplitude } from './audioTimeStep.js'
import { usePlayerStore } from '../store/usePlayerStore.js'
import { useReducedMotion } from '../hooks/useReducedMotion.js'

export function ParticleField({ count = 2000, palette }) {
  const materialRef = useRef()
  const geometryRef = useRef()
  const timeRef = useRef(0)
  const lastVisibleCountRef = useRef(count)
  const reducedMotion = useReducedMotion()

  const [positions, originals, normals] = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const originals = new Float32Array(count * 3)
    const normals = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const radius = 2 + Math.random() * 1.5
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi) * Math.sin(theta)
      const z = radius * Math.cos(phi)
      positions.set([x, y, z], i * 3)
      originals.set([x, y, z], i * 3)
      const len = Math.hypot(x, y, z) || 1
      normals.set([x / len, y / len, z / len], i * 3)
    }
    return [positions, originals, normals]
  }, [count])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMid: { value: 0 },
      uAmplitude: { value: 0.8 },
      uPointSize: { value: 0.2 },
      uStartColor: { value: new THREE.Color(palette.primary) },
      uEndColor: { value: new THREE.Color(palette.secondary) },
    }),
    [palette],
  )

  useFrame(() => {
    const { bass, mid, treble } = usePlayerStore.getState().audioBands
    timeRef.current += computeAudioTimeStep(bass)
    const material = materialRef.current
    if (!material) return
    material.uniforms.uTime.value = timeRef.current
    // Reduced motion: suppress audio-reactive deformation (curl amplitude,
    // mid-driven Z-bob) but keep the base curl-noise flow (uTime) advancing
    // so the field reads as a calm ambient gradient rather than a frozen
    // frame.
    if (reducedMotion) {
      material.uniforms.uMid.value = 0
      material.uniforms.uAmplitude.value = 0
    } else {
      material.uniforms.uMid.value = mid
      material.uniforms.uAmplitude.value = computeCurlAmplitude(treble)
    }

    const targetVisibleCount = Math.min(usePlayerStore.getState().particleVisibleCount, count)
    if (targetVisibleCount !== lastVisibleCountRef.current && geometryRef.current) {
      geometryRef.current.setDrawRange(0, targetVisibleCount)
      lastVisibleCountRef.current = targetVisibleCount
    }
  })

  return (
    <points>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aOriginal" count={count} array={originals} itemSize={3} />
        <bufferAttribute attach="attributes-aNormal" count={count} array={normals} itemSize={3} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  )
}
