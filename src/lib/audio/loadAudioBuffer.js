// Кеш живёт на уровне модуля: один и тот же трек анализируется один раз
// за сессию, даже если пользователь возвращается к нему несколько раз.
const bufferCache = new Map()

export async function loadAudioBuffer(url, audioContext) {
  if (bufferCache.has(url)) return bufferCache.get(url)

  const promise = (async () => {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to fetch audio for analysis: ${response.status} ${url}`)
    const arrayBuffer = await response.arrayBuffer()
    return audioContext.decodeAudioData(arrayBuffer)
  })()

  // Кешируем сам промис, а не результат: два одновременных запроса на один
  // трек не должны приводить к двум загрузкам.
  bufferCache.set(url, promise)
  try {
    return await promise
  } catch (error) {
    // Неудачную попытку из кеша убираем, иначе разовый сетевой сбой
    // навсегда закрыл бы анализ этого трека до перезагрузки страницы.
    bufferCache.delete(url)
    throw error
  }
}

export function clearAudioBufferCache() {
  bufferCache.clear()
}
