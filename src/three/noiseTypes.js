// Значения передаются в шейдер как float-uniform uNoiseType.
// Шейдер ветвится по ним через сравнения (< 0.5, < 1.5), поэтому
// значения должны быть целыми и идти подряд.
export const NOISE_TYPE_SIMPLEX_CURLY = 0
export const NOISE_TYPE_LAMINAR = 1
export const NOISE_TYPE_TURBULENT_GLITCH = 2

const BY_NAME = {
  simplex_curly: NOISE_TYPE_SIMPLEX_CURLY,
  laminar: NOISE_TYPE_LAMINAR,
  turbulent_glitch: NOISE_TYPE_TURBULENT_GLITCH,
}

export function noiseTypeToFloat(noiseType) {
  return BY_NAME[noiseType] ?? NOISE_TYPE_SIMPLEX_CURLY
}
