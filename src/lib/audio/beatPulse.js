// Доля пути от предыдущей доли к следующей: 0 ровно на доле, →1 перед следующей.
export function computeBeatPhase(currentTime, bpm) {
  if (!bpm || bpm <= 0) return 0
  const beatsElapsed = (currentTime * bpm) / 60
  return beatsElapsed - Math.floor(beatsElapsed)
}

// Резкая атака на доле с быстрым спадом. Четвёртая степень выбрана
// эмпирически: спад достаточно быстрый, чтобы удар читался отдельным
// импульсом, а не размазывался в непрерывное покачивание.
export function computeBeatPulse(currentTime, bpm) {
  if (!bpm || bpm <= 0) return 0
  return Math.pow(1 - computeBeatPhase(currentTime, bpm), 4)
}
