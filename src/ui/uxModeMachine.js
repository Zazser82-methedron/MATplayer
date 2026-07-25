export const UTILITY_HOLD_SECONDS = 3
export const AMBIENT_THRESHOLD_SECONDS = 10

export function computeUxMode(idleSeconds) {
  if (idleSeconds < UTILITY_HOLD_SECONDS) return 'utility'
  if (idleSeconds < AMBIENT_THRESHOLD_SECONDS) return 'focus'
  return 'ambient'
}
