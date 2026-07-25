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

export function buildLibraryEntries(artists, tracksById) {
  const entries = []
  for (const artist of artists) {
    for (const trackId of artist.track_ids) {
      const track = tracksById[trackId]
      if (!track) continue
      entries.push({
        artistId: artist.artist_id,
        artistName: artist.name,
        trackId: track.track_id,
        title: track.title ?? deriveTrackTitleFallback(track.track_id),
        mood: track.mood,
        tempoBpm: track.tempo_bpm,
      })
    }
  }
  return entries
}

export function searchLibraryEntries(entries, query) {
  const q = query.trim().toLowerCase()
  if (!q) return entries
  return entries.filter(
    (entry) =>
      entry.title.toLowerCase().includes(q) ||
      entry.artistName.toLowerCase().includes(q) ||
      entry.mood.toLowerCase().includes(q),
  )
}
