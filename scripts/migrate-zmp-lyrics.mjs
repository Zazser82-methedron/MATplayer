import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { parseKaraokeBlock } from './lib/parseKaraokeBlock.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
// Absolute, not relative: this is a one-off local migration script that reads from a
// sibling project OUTSIDE this repo (on the same machine) and is never meant to run in
// CI or on another machine. A relative path from __dirname would also silently break
// depending on whether this repo is checked out normally or inside a git worktree
// (different nesting depth), which a hardcoded absolute path avoids entirely.
const SOURCE = 'C:/Users/exxck/Projects/games/cupsize-v2-story/karaoke.js'
const OUT_DIR = join(__dirname, '../src/data/lyrics/cupsize')

function loadKaraokeObject(sourcePath) {
  const raw = readFileSync(sourcePath, 'utf-8')
  const match = raw.match(/const KARAOKE = (\{[\s\S]*\});?\s*$/)
  if (!match) {
    throw new Error(`Could not locate KARAOKE object literal in ${sourcePath}`)
  }
  // Source is our own trusted local file (not user input) — safe to evaluate as JS
  // rather than JSON.parse, since it uses unquoted numeric object keys.
  return new Function(`return ${match[1]}`)()
}

function main() {
  const karaoke = loadKaraokeObject(SOURCE)
  mkdirSync(OUT_DIR, { recursive: true })
  const trackNumbers = Object.keys(karaoke).map(Number).sort((a, b) => a - b)
  let written = 0
  for (const trackNum of trackNumbers) {
    const lines = parseKaraokeBlock(karaoke[trackNum])
    if (lines.length === 0) {
      console.warn(`Track ${trackNum}: no timestamped lines found, skipping`)
      continue
    }
    const outPath = join(OUT_DIR, `track-${String(trackNum).padStart(2, '0')}.json`)
    writeFileSync(outPath, `${JSON.stringify({ lines }, null, 2)}\n`)
    written += 1
  }
  console.log(`Wrote ${written} lyrics files to ${OUT_DIR}`)
}

main()
