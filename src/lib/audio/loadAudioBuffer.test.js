import { describe, it, expect, vi, afterEach } from 'vitest'
import { loadAudioBuffer } from './loadAudioBuffer.js'

function makeContext() {
  return { decodeAudioData: vi.fn(async () => ({ duration: 42 })) }
}

describe('loadAudioBuffer', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches, decodes and returns the buffer', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })))
    const ctx = makeContext()
    await expect(loadAudioBuffer('/a.mp3', ctx)).resolves.toEqual({ duration: 42 })
    expect(ctx.decodeAudioData).toHaveBeenCalledTimes(1)
  })

  it('rejects on a non-ok response, naming the status', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })))
    await expect(loadAudioBuffer('/missing.mp3', makeContext())).rejects.toThrow(/404/)
  })

  it('does not retain the buffer itself — repeated calls decode again', async () => {
    // Кеширование сознательно живёт уровнем выше (analyzeTrack): удержание
    // декодированных буферов упёрлось бы в ~1.4 ГБ на альбом из 26 треков.
    const fetchMock = vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }))
    vi.stubGlobal('fetch', fetchMock)
    const ctx = makeContext()
    await loadAudioBuffer('/a.mp3', ctx)
    await loadAudioBuffer('/a.mp3', ctx)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
