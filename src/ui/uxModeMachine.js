// Пороги подняты с 3/10 с: за три секунды интерфейс исчезал раньше, чем его
// успевали прочитать, и продукт выглядел «сломанным без кнопок».
export const UTILITY_HOLD_SECONDS = 8
export const AMBIENT_THRESHOLD_SECONDS = 20

export function computeUxMode(idleSeconds, { isPlaying = false } = {}) {
  // Пока музыка не играет, прятать нечего: сцена без звука — это не «режим
  // погружения», а пустой экран. Элементы управления уходят только поверх
  // идущего трека.
  if (!isPlaying) return 'utility'
  if (idleSeconds < UTILITY_HOLD_SECONDS) return 'utility'
  if (idleSeconds < AMBIENT_THRESHOLD_SECONDS) return 'focus'
  return 'ambient'
}
