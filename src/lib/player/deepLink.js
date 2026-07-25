export function parseDeepLink(search) {
  const params = new URLSearchParams(search)
  const rawTime = params.get('t')
  const parsedTime = rawTime === null ? NaN : Number(rawTime)
  const startTime = Number.isFinite(parsedTime) && parsedTime >= 0 ? parsedTime : null
  return {
    artistId: params.get('artist'),
    trackId: params.get('track'),
    startTime,
  }
}

export function buildDeepLinkSearch(artistId, trackId, startTime) {
  const params = new URLSearchParams({ artist: artistId, track: trackId })
  if (startTime > 0) params.set('t', String(Math.round(startTime * 10) / 10))
  return `?${params.toString()}`
}
