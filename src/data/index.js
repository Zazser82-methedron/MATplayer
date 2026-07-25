// Aggregates every artist/track/lyrics JSON file under src/data/ into flat
// lookups. Adding a new artist or track only requires dropping a new JSON
// file in the right folder — nothing here needs to change. This glob-based
// indexing is also the shape a future real backend would need to replace
// with an API call, without touching any UI code that consumes it.
const artistModules = import.meta.glob('./artists/*.json', { eager: true })
const trackModules = import.meta.glob('./tracks/**/*.json', { eager: true })
const lyricsModules = import.meta.glob('./lyrics/**/*.json', { eager: true })

function unwrap(mod) {
  return mod.default ?? mod
}

export const ARTISTS = Object.keys(artistModules)
  .sort()
  .map((key) => unwrap(artistModules[key]))

export const TRACKS_BY_ID = Object.fromEntries(
  Object.values(trackModules)
    .map(unwrap)
    .map((track) => [track.track_id, track]),
)

export function resolveLyrics(lyricsRef) {
  const key = `./lyrics/${lyricsRef}`
  const mod = lyricsModules[key]
  if (!mod) throw new Error(`No lyrics file found for lyrics_ref "${lyricsRef}" (looked for ${key})`)
  return unwrap(mod).lines
}
