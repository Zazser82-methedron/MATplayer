import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { computeBreathScale, computeBlinkScale } from './avatarMotion.js'

export function AvatarProxy({ palette, energy = 0.5, outlineThickness = 0.05 }) {
  const breathGroupRef = useRef()
  const leftEyeRef = useRef()
  const rightEyeRef = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const breath = computeBreathScale(t, energy)
    const blink = computeBlinkScale(t)
    if (breathGroupRef.current) breathGroupRef.current.scale.set(1, breath, 1)
    if (leftEyeRef.current) leftEyeRef.current.scale.y = blink
    if (rightEyeRef.current) rightEyeRef.current.scale.y = blink
  })

  return (
    <group ref={breathGroupRef}>
      <mesh name="avatar-body">
        <icosahedronGeometry args={[1, 1]} />
        <meshToonMaterial color={palette.primary} />
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
