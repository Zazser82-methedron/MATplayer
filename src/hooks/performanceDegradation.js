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

// Минимальная выдержка между сменами ступени. Без неё уровень пересчитывается
// каждый кадр и шагает по рунгу за кадр: на стабильных 25 fps лесенка за доли
// секунды сваливается в flat-2d, FPS подскакивает, лесенка так же быстро лезет
// обратно — и весь пост-процессинг мигает без остановки. Каждая смена ступени
// теперь монтирует/размонтирует EffectComposer с перекомпиляцией шейдеров,
// так что цена дребезга высокая.
export const MIN_FRAMES_BETWEEN_LEVEL_CHANGES = 90

export function shouldApplyLevelChange(framesSinceLastChange) {
  return framesSinceLastChange >= MIN_FRAMES_BETWEEN_LEVEL_CHANGES
}

export function isBloomEnabledAtLevel(levelIndex) {
  return levelIndex < DEGRADATION_LEVELS.indexOf('no-bloom')
}

export function isPostFxEnabledAtLevel(levelIndex) {
  return levelIndex < DEGRADATION_LEVELS.indexOf('no-postfx')
}

export function pixelRatioForFps(fps, currentPixelRatio, devicePixelRatio) {
  if (fps < 45 && currentPixelRatio > 1.0) return 1.0
  if (fps > 55 && currentPixelRatio < devicePixelRatio) {
    return Math.min(devicePixelRatio, currentPixelRatio + 0.25)
  }
  return currentPixelRatio
}
