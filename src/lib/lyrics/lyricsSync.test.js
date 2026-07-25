import { describe, it, expect } from 'vitest'
import { getCurrentLineIndex } from './lyricsSync.js'

const lines = [
  { time: 0, text: 'a' },
  { time: 5, text: 'b' },
  { time: 10, text: 'c' },
]

describe('getCurrentLineIndex', () => {
  it('returns -1 for an empty lines array', () => {
    expect(getCurrentLineIndex([], 3)).toBe(-1)
  })

  it('returns -1 before the first line starts', () => {
    expect(getCurrentLineIndex(lines, -1)).toBe(-1)
  })

  it('returns the index of the active line', () => {
    expect(getCurrentLineIndex(lines, 6)).toBe(1)
  })

  it('returns the last line index once past the final timestamp', () => {
    expect(getCurrentLineIndex(lines, 999)).toBe(2)
  })

  it('returns the exact-match line at its own timestamp', () => {
    expect(getCurrentLineIndex(lines, 5)).toBe(1)
  })
})
