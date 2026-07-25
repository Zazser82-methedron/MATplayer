import { clamp } from './audioTimeStep.js'

export function cubicBezierPoint(t, p0, p1, p2, p3) {
  const mt = 1 - t
  const a = mt * mt * mt
  const b = 3 * mt * mt * t
  const c = 3 * mt * t * t
  const d = t * t * t
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
    z: a * p0.z + b * p1.z + c * p2.z + d * p3.z,
  }
}

export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

export function computeCameraFlightPosition(elapsed, duration, startPos, endPos) {
  const rawT = clamp(elapsed / duration, 0, 1)
  const t = easeInOutCubic(rawT)
  const midHeight = Math.max(startPos.y, endPos.y) + 3
  const control1 = { x: startPos.x, y: midHeight, z: startPos.z }
  const control2 = { x: endPos.x, y: midHeight, z: endPos.z }
  return cubicBezierPoint(t, startPos, control1, control2, endPos)
}
