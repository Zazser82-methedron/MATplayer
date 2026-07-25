// Даунсэмплинг PCM до фиксированного числа столбиков.
//
// Берём RMS участка, а не пик модуля: на сведённом и лимитированном мастере
// почти в каждом окне из десятков тысяч сэмплов найдётся образец у самого
// потолка, поэтому пиковая огибающая вырождается в сплошной прямоугольник и
// не несёт никакой информации. Среднее со знаком тоже не годится — оно
// стремится к нулю из-за знакопеременности сигнала.
//
// Результат нормируется к самому громкому участку трека, иначе значения RMS
// лежали бы в узкой полосе у нижнего края и форма всё равно не читалась бы.
// На выходе — числа в диапазоне 0..1, готовые к масштабированию в проценты.
export function computeWaveformPeaks(channelData, bucketCount) {
  const peaks = new Array(bucketCount).fill(0)
  if (channelData.length === 0) return peaks

  const samplesPerBucket = channelData.length / bucketCount
  let loudest = 0

  for (let bucket = 0; bucket < bucketCount; bucket++) {
    const start = Math.floor(bucket * samplesPerBucket)
    const end = Math.min(channelData.length, Math.max(start + 1, Math.floor((bucket + 1) * samplesPerBucket)))
    let sumOfSquares = 0
    let count = 0
    for (let i = start; i < end; i++) {
      sumOfSquares += channelData[i] * channelData[i]
      count++
    }
    const rms = count === 0 ? 0 : Math.sqrt(sumOfSquares / count)
    peaks[bucket] = rms
    if (rms > loudest) loudest = rms
  }

  if (loudest > 0) {
    for (let bucket = 0; bucket < bucketCount; bucket++) peaks[bucket] /= loudest
  }
  return peaks
}
