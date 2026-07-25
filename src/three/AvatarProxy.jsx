import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { computeBreathScale, computeBlinkScale } from './avatarMotion.js'
import { usePlayerStore } from '../store/usePlayerStore.js'
import { computeBeatPulse } from '../lib/audio/beatPulse.js'

// Трёхступенчатая рампа освещения для meshToonMaterial. NearestFilter
// обязателен: с линейной фильтрацией ступени размываются обратно в
// градиент и toon-эффект пропадает.
function useToonGradientMap() {
  return useMemo(() => {
    const steps = new Uint8Array([80, 160, 255])
    const texture = new THREE.DataTexture(steps, steps.length, 1, THREE.RedFormat)
    texture.minFilter = THREE.NearestFilter
    texture.magFilter = THREE.NearestFilter
    texture.generateMipmaps = false
    texture.needsUpdate = true
    return texture
  }, [])
}

export function AvatarProxy({ palette, energy = 0.5, outlineThickness = 0.05 }) {
  const gradientMap = useToonGradientMap()
  const breathGroupRef = useRef()
  const leftEyeRef = useRef()
  const rightEyeRef = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const breath = computeBreathScale(t, energy)
    const blink = computeBlinkScale(t)
    // Транзиентное чтение: currentTime и detectedBpm меняются каждый кадр,
    // подписка через хук вызывала бы ре-рендер React на 60 fps.
    const { currentTime, detectedBpm } = usePlayerStore.getState()
    const pulse = computeBeatPulse(currentTime, detectedBpm) * 0.06
    if (breathGroupRef.current) breathGroupRef.current.scale.set(1 + pulse, breath + pulse, 1 + pulse)
    if (leftEyeRef.current) leftEyeRef.current.scale.y = blink
    if (rightEyeRef.current) rightEyeRef.current.scale.y = blink
  })

  return (
    <group ref={breathGroupRef}>
      <mesh name="avatar-body">
        <icosahedronGeometry args={[1, 1]} />
        <meshToonMaterial color={palette.primary} gradientMap={gradientMap} />
      </mesh>
      <mesh name="avatar-outline" scale={1 + outlineThickness}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#000000" side={THREE.BackSide} />
      </mesh>
      <mesh ref={leftEyeRef} position={[-0.35, 0.2, 0.85]} name="avatar-eye-left">
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshBasicMaterial color={palette.secondary} />
      </mesh>
      <mesh ref={rightEyeRef} position={[0.35, 0.2, 0.85]} name="avatar-eye-right">
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshBasicMaterial color={palette.secondary} />
      </mesh>
    </group>
  )
}
