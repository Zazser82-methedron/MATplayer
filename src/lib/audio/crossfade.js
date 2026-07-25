// Equal-power кроссфейд. Линейное сведение (1-t, t) даёт провал суммарной
// мощности примерно на 3 дБ в середине перехода — на слух это «дырка».
// Синус/косинус держат сумму квадратов усилений равной единице всюду.
export function computeCrossfadeGains(progress) {
  const t = Math.min(1, Math.max(0, progress))
  return {
    outgoingGain: Math.cos((t * Math.PI) / 2),
    incomingGain: Math.sin((t * Math.PI) / 2),
  }
}
