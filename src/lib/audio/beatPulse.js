// Доля пути от предыдущей доли к следующей: 0 ровно на доле, →1 перед следующей.
// beatOffset — время первой доли в секундах. Без него сетка отсчитывается от
// нуля, и пульсации идут в верном темпе, но со случайной фазой относительно
// музыки — на слух и на глаз это хуже, чем отсутствие пульсаций.
export function computeBeatPhase(currentTime, bpm, beatOffset = 0) {
  if (!bpm || bpm <= 0) return 0
  const beatsElapsed = ((currentTime - beatOffset) * bpm) / 60
  // Двойной модуль: до первой доли beatsElapsed отрицателен, а остаток от
  // деления отрицательного числа в JS отрицателен — фаза выпала бы из 0..1.
  return ((beatsElapsed % 1) + 1) % 1
}

// Резкая атака на доле с быстрым спадом. Четвёртая степень выбрана
// эмпирически: спад достаточно быстрый, чтобы удар читался отдельным
// импульсом, а не размазывался в непрерывное покачивание.
export function computeBeatPulse(currentTime, bpm, beatOffset = 0) {
  if (!bpm || bpm <= 0) return 0
  return Math.pow(1 - computeBeatPhase(currentTime, bpm, beatOffset), 4)
}
