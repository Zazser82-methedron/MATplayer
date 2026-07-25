export function computeFrequencyBands(freqData, sampleRate) {
  const bufferLength = freqData.length

  const bandAverage = (loHz, hiHz) => {
    const startBin = Math.floor((loHz * bufferLength) / sampleRate)
    const endBin = Math.floor((hiHz * bufferLength) / sampleRate)
    let sum = 0
    let count = 0
    for (let i = startBin; i < endBin && i < bufferLength; i++) {
      sum += freqData[i]
      count++
    }
    return count === 0 ? 0 : sum / count / 255
  }

  const bass = bandAverage(20, 250)
  const mid = bandAverage(250, 2000)
  const treble = bandAverage(2000, 12000)
  const level = (bass + mid + treble) / 3

  return { bass, mid, treble, level }
}
