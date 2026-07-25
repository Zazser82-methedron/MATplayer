import { computeCrossfadeGains } from './crossfade.js'

export class AudioCrossfader {
  constructor(context, { duration = 1.75 } = {}) {
    this.context = context
    this.duration = duration
  }

  crossfade(outgoingGainNode, incomingGainNode, onProgress) {
    const start = this.context.currentTime
    const step = () => {
      const elapsed = this.context.currentTime - start
      const progress = elapsed / this.duration
      const { outgoingGain, incomingGain } = computeCrossfadeGains(progress)
      outgoingGainNode.gain.value = outgoingGain
      incomingGainNode.gain.value = incomingGain
      if (onProgress) onProgress(progress)
      if (progress < 1) requestAnimationFrame(step)
    }
    step()
  }
}
