import { loadAudioBuffer } from './loadAudioBuffer.js'
import { computeWaveformPeaks } from './waveform.js'
import { detectTempo } from './beatDetector.js'

// Кешируется именно результат анализа, а не декодированный буфер: результат
// весит килобайты и живёт сессию, буфер — десятки мегабайт на трек.
// Хранится промис, чтобы два одновременных запроса на один трек не привели
// к двум загрузкам и двум декодированиям.
const analysisCache = new Map()

export async function analyzeTrack(url, audioContext, bucketCount, { signal } = {}) {
  const cached = analysisCache.get(url)
  if (cached) return cached

  const promise = (async () => {
    const buffer = await loadAudioBuffer(url, audioContext)
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    const peaks = computeWaveformPeaks(buffer.getChannelData(0), bucketCount)
    const { bpm, offset } = await detectTempo(buffer)
    // Ссылка на buffer дальше никуда не уходит — после выхода из этой
    // функции он становится недостижим и освобождается сборщиком.
    return { peaks, bpm, beatOffset: offset, duration: buffer.duration }
  })()

  analysisCache.set(url, promise)
  try {
    return await promise
  } catch (error) {
    // Неудачную попытку из кеша убираем, иначе разовый сетевой сбой навсегда
    // закрыл бы анализ этого трека до перезагрузки страницы.
    analysisCache.delete(url)
    throw error
  }
}

export function clearAnalysisCache() {
  analysisCache.clear()
}
