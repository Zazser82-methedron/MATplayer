import { guess } from 'web-audio-beat-detector'

export async function detectBpm(audioBuffer) {
  const { bpm } = await guess(audioBuffer)
  return bpm
}
