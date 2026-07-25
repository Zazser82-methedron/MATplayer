const TRACK_NUMBER_TOKEN = /^t?\d+$/i

// Fallback for tracks uploaded without a curated title (e.g. a future
// backend/upload flow) — derives something readable from the track_id.
export function deriveTrackTitleFallback(trackId) {
  return trackId
    .split(/[_-]+/)
    .filter((segment, index) => index > 0 && !TRACK_NUMBER_TOKEN.test(segment))
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

export function formatMood(mood) {
  return mood
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Записи собираются обходом альбомов, а не плоского списка треков артиста:
// именно альбом задаёт порядок треков, и он же нужен для группировки в UI.
// Если альбомы не переданы, поведение остаётся прежним — плоский список.
export function buildLibraryEntries(artists, tracksById, albums = null) {
  const entries = []
  for (const artist of artists) {
    const artistAlbums = albums?.filter((album) => album.artist_id === artist.artist_id)
    const groups = artistAlbums?.length
      ? artistAlbums.map((album) => ({ album, trackIds: album.track_ids }))
      : [{ album: null, trackIds: artist.track_ids }]

    for (const { album, trackIds } of groups) {
      for (const trackId of trackIds) {
        const track = tracksById[trackId]
        if (!track) continue
        entries.push({
          artistId: artist.artist_id,
          artistName: artist.name,
          albumId: album?.album_id ?? null,
          albumTitle: album?.title ?? null,
          trackId: track.track_id,
          title: track.title ?? deriveTrackTitleFallback(track.track_id),
          mood: track.mood,
          tempoBpm: track.tempo_bpm,
        })
      }
    }
  }
  return entries
}

// Группирует плоский список записей по альбомам, сохраняя порядок появления.
// Используется библиотекой и карточкой артиста, чтобы обе показывали один и
// тот же порядок.
export function groupEntriesByAlbum(entries) {
  const groups = []
  const byKey = new Map()
  for (const entry of entries) {
    const key = entry.albumId ?? `${entry.artistId}:__loose__`
    let group = byKey.get(key)
    if (!group) {
      group = {
        albumId: entry.albumId,
        albumTitle: entry.albumTitle,
        artistName: entry.artistName,
        entries: [],
      }
      byKey.set(key, group)
      groups.push(group)
    }
    group.entries.push(entry)
  }
  return groups
}

export function searchLibraryEntries(entries, query) {
  const q = query.trim().toLowerCase()
  if (!q) return entries
  return entries.filter(
    (entry) =>
      entry.title.toLowerCase().includes(q) ||
      entry.artistName.toLowerCase().includes(q) ||
      entry.mood.toLowerCase().includes(q) ||
      (entry.albumTitle?.toLowerCase().includes(q) ?? false),
  )
}
