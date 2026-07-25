export function parseLyrics(raw) {
  if (!raw || !Array.isArray(raw.lines)) {
    throw new Error('Invalid lyrics data: missing lines array')
  }
  const lines = raw.lines.map((line, i) => {
    if (typeof line.time !== 'number' || typeof line.text !== 'string') {
      throw new Error(`Invalid lyrics line at index ${i}`)
    }
    return { time: line.time, text: line.text }
  })
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].time < lines[i - 1].time) {
      throw new Error(`Lyrics lines out of order at index ${i}`)
    }
  }
  return lines
}
