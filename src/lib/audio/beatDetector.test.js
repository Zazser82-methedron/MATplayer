import { describe, it, expect, vi } from 'vitest'

vi.mock('web-audio-beat-detector', () => ({
  guess: vi.fn(async () => ({ bpm: 135, offset: 0.42 })),
}))

import { detectBpm } from './beatDetector.js'

describe('detectBpm', () => {
  it('resolves the bpm field from web-audio-beat-detector', async () => {
    const fakeAudioBuffer = {}
    const bpm = await detectBpm(fakeAudioBuffer)
    expect(bpm).toBe(135)
  })
})
