import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { computeDegradationLevel, pixelRatioForFps, particleCountForLevel } from './performanceDegradation.js'
import { usePlayerStore } from '../store/usePlayerStore.js'

const FPS_SAMPLE_WINDOW = 30

export function usePerformanceDegradation() {
  const { gl, setDpr } = useThree()
  const levelIndexRef = useRef(0)
  const pixelRatioRef = useRef(gl.getPixelRatio())
  const maxPixelRatioRef = useRef(gl.getPixelRatio())
  const frameTimesRef = useRef([])

  useFrame((_, delta) => {
    const fps = delta > 0 ? 1 / delta : 60
    frameTimesRef.current.push(fps)
    if (frameTimesRef.current.length > FPS_SAMPLE_WINDOW) frameTimesRef.current.shift()
    const avgFps = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length

    const nextLevelIndex = computeDegradationLevel(avgFps, levelIndexRef.current)
    if (nextLevelIndex !== levelIndexRef.current) {
      levelIndexRef.current = nextLevelIndex
      usePlayerStore.getState().setParticleVisibleCount(particleCountForLevel(nextLevelIndex))
      usePlayerStore.getState().setDegradationLevel(nextLevelIndex)
    }

    const nextPixelRatio = pixelRatioForFps(avgFps, pixelRatioRef.current, maxPixelRatioRef.current)
    if (nextPixelRatio !== pixelRatioRef.current) {
      pixelRatioRef.current = nextPixelRatio
      setDpr(nextPixelRatio)
    }
  })
}

export function PerformanceManager() {
  usePerformanceDegradation()
  return null
}
