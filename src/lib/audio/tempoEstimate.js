// Оценка темпа и фазы первой доли по сырому PCM.
//
// Нужна отдельная от браузерной реализация: `web-audio-beat-detector` требует
// AudioBuffer и Web Audio API, которых в Node нет, а считать темп мы хотим
// один раз при сборке, а не в браузере у каждого слушателя.
//
// Схема стандартная: энергетическая огибающая → функция появления нот
// (onset envelope) → гребенчатый фильтр по сетке долей. Гребёнка сразу даёт
// и темп, и смещение первой доли, что важно: без фазы пульсации идут в верном
// темпе, но мимо музыки.

export const DEFAULT_ENVELOPE_RATE = 100 // отсчётов огибающей в секунду
const MIN_BPM = 60
const MAX_BPM = 190
const BPM_STEP = 0.25

// Огибающая берётся как положительная разность энергии соседних окон:
// удары дают резкий рост энергии, а плавное затухание нас не интересует.
export function computeOnsetEnvelope(samples, sampleRate, envelopeRate = DEFAULT_ENVELOPE_RATE) {
  const hop = Math.max(1, Math.round(sampleRate / envelopeRate))
  const frameCount = Math.floor(samples.length / hop)
  const envelope = new Float32Array(Math.max(0, frameCount - 1))
  if (frameCount < 2) return envelope

  let previousEnergy = 0
  for (let i = 0; i < hop && i < samples.length; i++) previousEnergy += samples[i] * samples[i]

  for (let frame = 1; frame < frameCount; frame++) {
    let energy = 0
    const start = frame * hop
    const end = Math.min(samples.length, start + hop)
    for (let i = start; i < end; i++) energy += samples[i] * samples[i]
    const rise = energy - previousEnergy
    envelope[frame - 1] = rise > 0 ? rise : 0
    previousEnergy = energy
  }
  return envelope
}

function normalize(envelope) {
  let max = 0
  for (const value of envelope) if (value > max) max = value
  if (max === 0) return envelope
  const out = new Float32Array(envelope.length)
  for (let i = 0; i < envelope.length; i++) out[i] = envelope[i] / max
  return out
}

// Сумма огибающей в точках предполагаемых долей. Чем лучше сетка совпадает
// с реальными ударами, тем выше сумма.
function scoreGrid(envelope, beatPeriod, phase) {
  let score = 0
  let beats = 0
  for (let position = phase; position < envelope.length; position += beatPeriod) {
    score += envelope[Math.round(position)] ?? 0
    beats++
  }
  return beats === 0 ? 0 : score / Math.sqrt(beats)
}

// Гребёнка одинаково хорошо ложится на темп, вдвое больший или меньший
// настоящего — это классическая «ошибка октавы». Слух же почти всегда
// выбирает вариант ближе к ~120 BPM, поэтому среди кратных берём тот,
// что ближе к перцептивному центру, если он не сильно проигрывает по счёту.
const PERCEPTUAL_CENTER_BPM = 120
const OCTAVE_TOLERANCE = 0.9

function foldOctaves(candidates) {
  const best = candidates[0]
  const distance = (bpm) => Math.abs(Math.log2(bpm / PERCEPTUAL_CENTER_BPM))
  let chosen = best
  for (const candidate of candidates) {
    if (candidate.score >= best.score * OCTAVE_TOLERANCE && distance(candidate.bpm) < distance(chosen.bpm)) {
      chosen = candidate
    }
  }
  return chosen
}

export function estimateTempo(envelope, envelopeRate = DEFAULT_ENVELOPE_RATE) {
  if (envelope.length < envelopeRate) return { bpm: null, offset: 0 }
  const normalized = normalize(envelope)

  const scoreAt = (bpm) => {
    const beatPeriod = (60 / bpm) * envelopeRate
    let best = { bpm, offset: 0, score: -Infinity }
    // Фазу ищем в пределах одного периода — дальше сетка повторяется.
    for (let phase = 0; phase < beatPeriod; phase += 1) {
      const score = scoreGrid(normalized, beatPeriod, phase)
      if (score > best.score) best = { bpm, offset: phase / envelopeRate, score }
    }
    return best
  }

  let best = { bpm: null, offset: 0, score: -Infinity }
  for (let bpm = MIN_BPM; bpm <= MAX_BPM; bpm += BPM_STEP) {
    const candidate = scoreAt(bpm)
    if (candidate.score > best.score) best = candidate
  }
  if (best.bpm === null) return { bpm: null, offset: 0 }

  const octaves = [best]
  for (const factor of [0.5, 2]) {
    const folded = best.bpm * factor
    if (folded >= MIN_BPM && folded <= MAX_BPM) octaves.push(scoreAt(folded))
  }
  const chosen = foldOctaves(octaves)

  return {
    bpm: Math.round(chosen.bpm * 10) / 10,
    offset: Math.round(chosen.offset * 1000) / 1000,
  }
}

export function estimateTempoFromSamples(samples, sampleRate) {
  return estimateTempo(computeOnsetEnvelope(samples, sampleRate), DEFAULT_ENVELOPE_RATE)
}
