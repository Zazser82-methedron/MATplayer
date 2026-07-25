export function parseKaraokeBlock(block) {
  const lineRe = /\[(\d{2}):(\d{2})\.(\d{1,3})\]\s*(.*)/g
  const lines = []
  let m
  while ((m = lineRe.exec(block)) !== null) {
    const [, mm, ss, frac, text] = m
    const time = Number(mm) * 60 + Number(ss) + Number(`0.${frac}`)
    lines.push({ time, text: text.trim() })
  }

  // Known source-data quirk: a small number of tracks have a trailing
  // "end of vocals" marker (empty text) whose timestamp regressed before
  // the previous line — almost certainly a typo in the upstream data.
  // Only this exact pattern (last line, empty text, time < previous line's
  // time) is dropped; any other line, including non-trailing or
  // non-empty-text lines, is left untouched.
  if (lines.length >= 2) {
    const last = lines[lines.length - 1]
    const prev = lines[lines.length - 2]
    if (last.text === '' && last.time < prev.time) {
      console.warn(
        `Dropping out-of-order trailing marker at ${last.time}s (before previous line at ${prev.time}s)`
      )
      lines.pop()
    }
  }

  return lines
}
