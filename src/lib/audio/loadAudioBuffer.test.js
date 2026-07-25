import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { loadAudioBuffer, clearAudioBufferCache } from './loadAudioBuffer.js'

function makeContext() {
  return { decodeAudioData: vi.fn(async () => ({ duration: 42 })) }
}

describe('loadAudioBuffer', () => {
  beforeEach(() => {
    clearAudioBufferCache()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches, decodes and returns the buffer', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })))
    const ctx = makeContext()
    await expect(loadAudioBuffer('/a.mp3', ctx)).resolves.toEqual({ duration: 42 })
    expect(ctx.decodeAudioData).toHaveBeenCalledTimes(1)
  })

  it('serves a repeated request from cache without re-fetching', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }))
    vi.stubGlobal('fetch', fetchMock)
    const ctx = makeContext()
    await loadAudioBuffer('/a.mp3', ctx)
    await loadAudioBuffer('/a.mp3', ctx)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(ctx.decodeAudioData).toHaveBeenCalledTimes(1)
  })

  it('deduplicates two concurrent requests for the same url', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }))
    vi.stubGlobal('fetch', fetchMock)
    const ctx = makeContext()
    await Promise.all([loadAudioBuffer('/a.mp3', ctx), loadAudioBuffer('/a.mp3', ctx)])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('rejects on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })))
    await expect(loadAudioBuffer('/missing.mp3', makeContext())).rejects.toThrow(/404/)
  })

  it('does not cache a failure, so a later attempt can succeed', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValue({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })
    vi.stubGlobal('fetch', fetchMock)
    const ctx = makeContext()
    await expect(loadAudioBuffer('/a.mp3', ctx)).rejects.toThrow()
    await expect(loadAudioBuffer('/a.mp3', ctx)).resolves.toEqual({ duration: 42 })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('keeps separate cache entries per url', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }))
    vi.stubGlobal('fetch', fetchMock)
    const ctx = makeContext()
    await loadAudioBuffer('/a.mp3', ctx)
    await loadAudioBuffer('/b.mp3', ctx)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
