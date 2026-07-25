// Слух воспринимает громкость логарифмически: линейный слайдер ощущается
// так, будто вся регулировка происходит в нижней четверти хода. Куб —
// дешёвое и общепринятое приближение перцептивной кривой.
const CURVE_EXPONENT = 3

export function clampVolume(value) {
  return Math.min(1, Math.max(0, value))
}

export function uiVolumeToGain(uiVolume) {
  return Math.pow(clampVolume(uiVolume), CURVE_EXPONENT)
}

export function gainToUiVolume(gain) {
  return Math.pow(clampVolume(gain), 1 / CURVE_EXPONENT)
}
