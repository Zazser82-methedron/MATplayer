import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AudioEngine } from './AudioEngine.js'

// Имитируем ключевое ограничение Web Audio: createMediaElementSource можно
// вызвать для одного элемента ровно один раз за его жизнь, повторный вызов
// бросает InvalidStateError. Именно на этом приложение падало в белый экран
// при каждом npm run dev, потому что StrictMode монтирует эффекты дважды.
function installFakeAudioContext() {
  const connectedElements = new WeakSet()
  const created = { contexts: 0, sources: 0, analysers: 0 }

  class FakeAudioContext {
    constructor() {
      created.contexts++
      this.state = 'suspended'
      this.sampleRate = 48000
      this.destination = { kind: 'destination' }
    }
    createMediaElementSource(element) {
      if (connectedElements.has(element)) {
        throw new DOMException(
          "Failed to execute 'createMediaElementSource' on 'AudioContext': HTMLMediaElement already connected previously to a different MediaElementSourceNode.",
          'InvalidStateError',
        )
      }
      connectedElements.add(element)
      created.sources++
      return { connect: vi.fn(), disconnect: vi.fn() }
    }
    createAnalyser() {
      created.analysers++
      return { fftSize: 0, frequencyBinCount: 1024, connect: vi.fn(), disconnect: vi.fn(), getByteFrequencyData: vi.fn() }
    }
    resume() {
      this.state = 'running'
      return Promise.resolve()
    }
  }

  vi.stubGlobal('window', { AudioContext: FakeAudioContext })
  return created
}

describe('AudioEngine', () => {
  let created

  beforeEach(() => {
    vi.unstubAllGlobals()
    created = installFakeAudioContext()
  })

  it('constructs cleanly for a fresh element', () => {
    const element = {}
    const engine = new AudioEngine(element)
    expect(engine.context).toBeDefined()
    expect(created.sources).toBe(1)
  })

  it('survives being constructed twice for the same element (React StrictMode)', () => {
    const element = {}
    const first = new AudioEngine(element)
    first.dispose()
    // Без переиспользования узла этот вызов бросал InvalidStateError, React
    // размонтировал дерево и страница оставалась пустой.
    expect(() => new AudioEngine(element)).not.toThrow()
    expect(created.sources).toBe(1)
    expect(created.contexts).toBe(1)
  })

  it('creates a separate graph for a different element', () => {
    new AudioEngine({})
    new AudioEngine({})
    expect(created.sources).toBe(2)
  })

  it('disconnects only its own analyser on dispose, keeping the shared graph alive', () => {
    const element = {}
    const engine = new AudioEngine(element)
    engine.dispose()
    expect(engine.source.disconnect).toHaveBeenCalledWith(engine.analyser)
    expect(engine.analyser.disconnect).toHaveBeenCalled()
    // Контекст закрывать нельзя: source к нему привязан навсегда.
    expect(engine.context.state).not.toBe('closed')
  })

  it('resumes a suspended context, since all playback is routed through it', () => {
    const engine = new AudioEngine({})
    expect(engine.context.state).toBe('suspended')
    engine.resume()
    expect(engine.context.state).toBe('running')
  })
})
