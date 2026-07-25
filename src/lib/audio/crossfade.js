export function computeCrossfadeGains(progress) {
  const t = Math.min(1, Math.max(0, progress))
  return { outgoingGain: 1 - t, incomingGain: t }
}
