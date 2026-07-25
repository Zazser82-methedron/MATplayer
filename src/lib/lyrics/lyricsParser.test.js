import { describe, it, expect } from 'vitest'
import { parseLyrics } from './lyricsParser.js'

describe('parseLyrics', () => {
  it('parses a valid lines array', () => {
    const raw = { lines: [{ time: 7.66, text: 'строка один' }, { time: 13, text: 'строка два' }] }
    expect(parseLyrics(raw)).toEqual(raw.lines)
  })

  it('throws when lines is missing', () => {
    expect(() => parseLyrics({})).toThrow('missing lines array')
  })

  it('throws when a line has a non-numeric time', () => {
    expect(() => parseLyrics({ lines: [{ time: '7.66', text: 'x' }] })).toThrow(
      'Invalid lyrics line at index 0',
    )
  })

  it('throws when lines are out of chronological order', () => {
    const raw = { lines: [{ time: 5, text: 'a' }, { time: 3, text: 'b' }] }
    expect(() => parseLyrics(raw)).toThrow('out of order at index 1')
  })
})
