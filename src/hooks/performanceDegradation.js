export const DEGRADATION_LEVELS = ['full', 'no-bloom', 'no-postfx', 'reduced-particles', 'flat-2d']

export function computeDegradationLevel(fps, currentLevelIndex) {
  if (fps < 30 && currentLevelIndex < DEGRADATION_LEVELS.length - 1) {
    return currentLevelIndex + 1
  }
  if (fps > 55 && currentLevelIndex > 0) {
    return currentLevelIndex - 1
  }
  return currentLevelIndex
}

const PARTICLE_COUNTS_BY_LEVEL = [2000, 2000, 2000, 500, 0]

export function particleCountForLevel(levelIndex) {
  return PARTICLE_COUNTS_BY_LEVEL[levelIndex] ?? 0
}

export function pixelRatioForFps(fps, currentPixelRatio, devicePixelRatio) {
  if (fps < 45 && currentPixelRatio > 1.0) return 1.0
  if (fps > 55 && currentPixelRatio < devicePixelRatio) {
    return Math.min(devicePixelRatio, currentPixelRatio + 0.25)
  }
  return currentPixelRatio
}
