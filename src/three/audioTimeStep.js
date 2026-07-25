export function mapLinear(value, inMin, inMax, outMin, outMax) {
  const t = (value - inMin) / (inMax - inMin)
  return outMin + t * (outMax - outMin)
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function computeAudioTimeStep(bassLevel) {
  return clamp(mapLinear(bassLevel, 0.6, 1, 0.2, 0.5), 0.2, 0.5)
}

export function computeCurlAmplitude(highLevel) {
  return 0.8 + mapLinear(highLevel, 0, 0.6, 0, 0.2)
}
