import { guess } from 'web-audio-beat-detector'

// guess() возвращает и темп, и смещение первой доли. Без offset сетка долей
// считается от нуля, поэтому пульсации идут в правильном темпе, но со
// случайной фазой относительно музыки — это читается как «не в такт», что
// хуже, чем отсутствие пульсаций вовсе.
export async function detectTempo(audioBuffer) {
  const { bpm, offset } = await guess(audioBuffer)
  return { bpm, offset: offset ?? 0 }
}

export async function detectBpm(audioBuffer) {
  const { bpm } = await detectTempo(audioBuffer)
  return bpm
}
