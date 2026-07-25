import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { analyzeTrack, clearAnalysisCache } from './analyzeTrack.js'

vi.mock('./beatDetector.js', () => ({
  detectTempo: vi.fn(async () => ({ bpm: 128, offset: 0.31 })),
}))

function makeContext(channelSamples = new Float32Array([0.2, 0.2, 0.8, 0.8])) {
  return {
    decodeAudioData: vi.fn(async () => ({
      duration: 144,
      numberOfChannels: 2,
      getChannelData: () => channelSamples,
    })),
  }
}

describe('analyzeTrack', () => {
  beforeEach(() => {
    clearAnalysisCache()
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns peaks, tempo, beat offset and duration', async () => {
    const result = await analyzeTrack('/a.mp3', makeContext(), 2)
    expect(result.peaks).toHaveLength(2)
    expect(result.bpm).toBe(128)
    expect(result.beatOffset).toBe(0.31)
    expect(result.duration).toBe(144)
  })

  it('serves a repeated request from cache without re-fetching or re-decoding', async () => {
    const ctx = makeContext()
    await analyzeTrack('/a.mp3', ctx, 2)
    await analyzeTrack('/a.mp3', ctx, 2)
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    expect(ctx.decodeAudioData).toHaveBeenCalledTimes(1)
  })

  it('deduplicates two concurrent requests for the same url', async () => {
    const ctx = makeContext()
    await Promise.all([analyzeTrack('/a.mp3', ctx, 2), analyzeTrack('/a.mp3', ctx, 2)])
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  it('caches the small analysis result, never the decoded buffer', async () => {
    const result = await analyzeTrack('/a.mp3', makeContext(), 2)
    // Ключевая гарантия против кеша на ~1.4 ГБ: наружу не должно уходить
    // ничего, через что можно дотянуться до PCM-данных.
    expect(result).not.toHaveProperty('buffer')
    expect(result).not.toHaveProperty('getChannelData')
    expect(Object.keys(result).sort()).toEqual(['beatOffset', 'bpm', 'duration', 'peaks'])
  })

  it('does not cache a failure, so a later attempt can succeed', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValue({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }),
    )
    const ctx = makeContext()
    await expect(analyzeTrack('/a.mp3', ctx, 2)).rejects.toThrow()
    await expect(analyzeTrack('/a.mp3', ctx, 2)).resolves.toMatchObject({ bpm: 128 })
  })

  it('keeps separate cache entries per url', async () => {
    const ctx = makeContext()
    await analyzeTrack('/a.mp3', ctx, 2)
    await analyzeTrack('/b.mp3', ctx, 2)
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
  })
})
