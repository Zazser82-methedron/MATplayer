export const BREATH_SPEED = 0.6
export const BREATH_AMPLITUDE = 0.04
export const BLINK_INTERVAL = 4
export const BLINK_DURATION = 0.15

export function computeBreathScale(elapsedTime, energy = 0.5) {
  const speed = BREATH_SPEED * (0.7 + energy * 0.6)
  return 1 + Math.sin(elapsedTime * speed * Math.PI * 2) * BREATH_AMPLITUDE
}

export function computeBlinkScale(elapsedTime) {
  const cyclePos = elapsedTime % BLINK_INTERVAL
  if (cyclePos >= BLINK_DURATION) return 1
  const blinkProgress = cyclePos / BLINK_DURATION
  return 1 - Math.sin(blinkProgress * Math.PI) * 0.9
}
