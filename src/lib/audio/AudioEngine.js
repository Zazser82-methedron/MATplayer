import { computeFrequencyBands } from './frequencyBands.js'

export class AudioEngine {
  constructor(audioElement, { fftSize = 2048 } = {}) {
    this.audioElement = audioElement
    this.context = new (window.AudioContext || window.webkitAudioContext)()
    this.source = this.context.createMediaElementSource(audioElement)
    this.analyser = this.context.createAnalyser()
    this.analyser.fftSize = fftSize
    this.source.connect(this.analyser)
    this.analyser.connect(this.context.destination)
    this.freqData = new Uint8Array(this.analyser.frequencyBinCount)
  }

  getFrequencyBands() {
    this.analyser.getByteFrequencyData(this.freqData)
    return computeFrequencyBands(this.freqData, this.context.sampleRate)
  }

  dispose() {
    this.source.disconnect()
    this.analyser.disconnect()
    this.context.close()
  }
}
