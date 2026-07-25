// Даунсэмплинг PCM до фиксированного числа столбиков. Берём именно пик, а
// не среднее: среднее по громкому участку стремится к нулю из-за
// знакопеременности сигнала и рисует плоскую линию вместо формы волны.
export function computeWaveformPeaks(channelData, bucketCount) {
  const peaks = new Array(bucketCount).fill(0)
  if (channelData.length === 0) return peaks

  const samplesPerBucket = channelData.length / bucketCount
  for (let bucket = 0; bucket < bucketCount; bucket++) {
    const start = Math.floor(bucket * samplesPerBucket)
    const end = Math.min(channelData.length, Math.max(start + 1, Math.floor((bucket + 1) * samplesPerBucket)))
    let peak = 0
    for (let i = start; i < end; i++) {
      const magnitude = Math.abs(channelData[i])
      if (magnitude > peak) peak = magnitude
    }
    peaks[bucket] = peak
  }
  return peaks
}
