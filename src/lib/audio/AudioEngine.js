import { computeFrequencyBands } from './frequencyBands.js'

// createMediaElementSource можно вызвать для одного <audio> ровно один раз за
// всю его жизнь — повторный вызов бросает InvalidStateError. React StrictMode
// в dev-режиме монтирует эффекты дважды, поэтому без переиспользования узла
// приложение падало в белый экран при каждом `npm run dev`. Прод-сборка это
// не ловила (StrictMode там не удваивает), e2e тоже — он гоняет preview.
const graphPerElement = new WeakMap()

function getOrCreateGraph(audioElement) {
  const existing = graphPerElement.get(audioElement)
  if (existing) return existing
  const context = new (window.AudioContext || window.webkitAudioContext)()
  const source = context.createMediaElementSource(audioElement)
  const graph = { context, source }
  graphPerElement.set(audioElement, graph)
  return graph
}

export class AudioEngine {
  constructor(audioElement, { fftSize = 2048 } = {}) {
    this.audioElement = audioElement
    const { context, source } = getOrCreateGraph(audioElement)
    this.context = context
    this.source = source
    this.analyser = context.createAnalyser()
    this.analyser.fftSize = fftSize
    this.source.connect(this.analyser)
    this.analyser.connect(this.context.destination)
    this.freqData = new Uint8Array(this.analyser.frequencyBinCount)
  }

  getFrequencyBands() {
    this.analyser.getByteFrequencyData(this.freqData)
    return computeFrequencyBands(this.freqData, this.context.sampleRate)
  }

  // Браузер создаёт AudioContext в состоянии suspended, пока не было жеста
  // пользователя. Так как всё воспроизведение маршрутизировано через этот
  // контекст, без resume() звука не будет вовсе, а анализатор вернёт нули.
  resume() {
    if (this.context.state === 'suspended') this.context.resume().catch(() => {})
  }

  dispose() {
    // Контекст и source-узел намеренно живут столько же, сколько сам <audio>:
    // пересоздать source для того же элемента нельзя. Снимаем только свой
    // анализатор, иначе после ремаунта на источник повиснет второй.
    this.source.disconnect(this.analyser)
    this.analyser.disconnect()
  }
}
