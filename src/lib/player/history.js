export const HISTORY_LIMIT = 50

export function pushHistoryEntry(history, trackId) {
  const withoutDuplicate = history.filter((id) => id !== trackId)
  return [trackId, ...withoutDuplicate].slice(0, HISTORY_LIMIT)
}

export function toggleFavorite(favorites, trackId) {
  return favorites.includes(trackId)
    ? favorites.filter((id) => id !== trackId)
    : [...favorites, trackId]
}
