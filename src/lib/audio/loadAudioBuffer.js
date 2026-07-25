// Скачивает и декодирует файл. Кеша здесь намеренно нет: декодированный
// AudioBuffer 144-секундного стерео на 48 кГц весит ~53 МБ, и удержание их
// по треку упёрлось бы в ~1.4 ГБ на альбоме из 26 песен. Кешируется
// результат анализа (см. analyzeTrack.js) — он весит килобайты, а сам буфер
// освобождается сразу после извлечения пиков и темпа.
export async function loadAudioBuffer(url, audioContext) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch audio for analysis: ${response.status} ${url}`)
  const arrayBuffer = await response.arrayBuffer()
  return audioContext.decodeAudioData(arrayBuffer)
}
