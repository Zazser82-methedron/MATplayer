export const REPEAT_MODES = ['off', 'all', 'one']

export function nextRepeatMode(mode) {
  const index = REPEAT_MODES.indexOf(mode)
  return REPEAT_MODES[(index + 1) % REPEAT_MODES.length]
}

// Возвращает следующий индекс в очереди либо null, если двигаться некуда
// (конец очереди при repeat: off) — вызывающий код трактует null как «стоп».
export function computeNextIndex(currentIndex, queueLength, repeatMode, direction) {
  if (queueLength <= 0) return null
  if (repeatMode === 'one') return currentIndex
  const candidate = currentIndex + direction
  if (candidate >= 0 && candidate < queueLength) return candidate
  if (repeatMode === 'all') return (candidate + queueLength) % queueLength
  return null
}

// Перемешивание Фишера—Йетса. Источник случайности передаётся параметром,
// чтобы тест был детерминированным. Если задан firstIndex, этот трек
// ставится в начало — иначе включение shuffle обрывало бы текущий трек.
export function buildShuffledOrder(queueLength, random = Math.random, firstIndex = null) {
  const order = Array.from({ length: queueLength }, (_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  if (firstIndex !== null && order.length > 0) {
    const position = order.indexOf(firstIndex)
    if (position > 0) {
      ;[order[0], order[position]] = [order[position], order[0]]
    }
  }
  return order
}
