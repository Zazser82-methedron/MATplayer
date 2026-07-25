import { describe, it, expect } from 'vitest'
import { parseLyrics } from '../lib/lyrics/lyricsParser.js'
import { TRACKS_BY_ID, resolveLyrics } from './index.js'

describe('lyrics_ref resolution', () => {
  it('resolves and parses the lyrics file referenced by every track profile', () => {
    for (const track of Object.values(TRACKS_BY_ID)) {
      const lines = resolveLyrics(track.lyrics_ref)
      expect(() => parseLyrics({ lines }), `lyrics for ${track.track_id}`).not.toThrow()
    }
  })

  it('never leaves a raw timestamp marker inside displayed lyric text', () => {
    // Регрессия: маркер следующей реплики попадал в текст предыдущей и
    // показывался на экране как «[01:37.93] Пусть этот мир утонет...».
    for (const track of Object.values(TRACKS_BY_ID)) {
      for (const line of resolveLyrics(track.lyrics_ref)) {
        expect(line.text, `${track.track_id} @ ${line.time}s`).not.toMatch(/\[\d{2}:\d{2}/)
      }
    }
  })

  it('keeps every lyric line in chronological order', () => {
    for (const track of Object.values(TRACKS_BY_ID)) {
      const lines = resolveLyrics(track.lyrics_ref)
      for (let i = 1; i < lines.length; i++) {
        expect(lines[i].time, `${track.track_id} line ${i}`).toBeGreaterThanOrEqual(lines[i - 1].time)
      }
    }
  })
})
