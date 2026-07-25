// Текст реплики забирается до СЛЕДУЮЩЕГО маркера, а не до конца физической
// строки. В исходнике переводы строк местами записаны литеральными
// последовательностями "\n" внутри JS-строки, и жадный (.*) в таком месте
// проглатывал маркер следующей реплики — её таймкод оставался внутри текста и
// потом показывался пользователю как «[01:37.93] Пусть этот мир утонет...».
const LINE_RE = /\[(\d{2}):(\d{2})\.(\d{1,3})\]([\s\S]*?)(?=\[\d{2}:\d{2}\.\d{1,3}\]|$)/g

export function parseKaraokeBlock(block) {
  const lines = []
  let m
  LINE_RE.lastIndex = 0
  while ((m = LINE_RE.exec(block)) !== null) {
    const [, mm, ss, frac, rawText] = m
    const time = Number(mm) * 60 + Number(ss) + Number(`0.${frac}`)
    // Литеральные "\n" из исходника — разделители, а не часть реплики.
    const text = rawText.replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim()
    lines.push({ time, text })
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
