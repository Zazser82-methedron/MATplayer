const SWIPE_THRESHOLD_PX = 50
const TAP_MAX_DISTANCE_PX = 10
const DOUBLE_TAP_MAX_INTERVAL_MS = 300

export function classifySwipe(startX, startY, endX, endY) {
  const dx = endX - startX
  const dy = endY - startY
  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)

  if (absDx < TAP_MAX_DISTANCE_PX && absDy < TAP_MAX_DISTANCE_PX) return 'tap'
  if (absDx > absDy && absDx > SWIPE_THRESHOLD_PX) return dx > 0 ? 'right' : 'left'
  if (absDy > absDx && absDy > SWIPE_THRESHOLD_PX) return dy > 0 ? 'down' : 'up'
  return null
}

export function isDoubleTap(previousTapTime, currentTapTime) {
  if (previousTapTime === null) return false
  return currentTapTime - previousTapTime <= DOUBLE_TAP_MAX_INTERVAL_MS
}
