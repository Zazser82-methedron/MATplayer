// Импортирует альбом «ЗМП» целиком: перекодирует исходные mp3 и генерирует
// профили треков.
//
// Названия и настроения взяты из авторского массива TRACKS в
// cupsize-v2-story/main.js — они точнее всего, что можно вывести из аудио
// автоматически. Аудио пережимается в 128 kbps: оригиналы весят 174 МБ, а
// плеер скачивает каждый трек дважды (стримом для <audio> и целиком для
// анализа waveform/BPM), поэтому экономия трафика тут двойная.
import { execFileSync } from 'node:child_process'
import { writeFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE_AUDIO_DIR = 'C:/Users/exxck/Projects/games/cupsize-v2-story/audio'
const TARGET_AUDIO_DIR = join(projectRoot, 'public/audio/cupsize')
const TARGET_PROFILE_DIR = join(projectRoot, 'src/data/tracks/cupsize')
const FFMPEG = 'C:/Users/exxck/Projects/tools/tools/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe'
const BITRATE = '128k'

// n, title, mood — дословно из TRACKS в cupsize-v2-story/main.js
const TRACKS = [
  { n: 1, title: 'Семнадцать ножевых', mood: 'злой' },
  { n: 2, title: 'Детская травма', mood: 'страшный' },
  { n: 3, title: 'Вся моя жизнь говно', mood: 'злой' },
  { n: 4, title: 'Будка', mood: 'грустный' },
  { n: 5, title: 'Розовая могила', mood: 'мрачный' },
  { n: 6, title: 'Следак', mood: 'напряжённый' },
  { n: 7, title: 'Черновик', mood: 'задумчивый' },
  { n: 8, title: 'Ты уебалась головой', mood: 'злой' },
  { n: 9, title: 'Первокурсница', mood: 'грустный' },
  { n: 10, title: 'ЗППП', mood: 'горький' },
  { n: 11, title: 'Станцуй со мной', mood: 'нежный' },
  { n: 12, title: 'Верёвка', mood: 'тёмный' },
  { n: 13, title: 'Я без ума от тебя', mood: 'нежный' },
  { n: 14, title: 'Север', mood: 'холодный' },
  { n: 15, title: 'Вата', mood: 'мягкий' },
  { n: 16, title: 'Напорносайтах', mood: 'горький' },
  { n: 17, title: 'По барабану', mood: 'злой' },
  { n: 18, title: 'Велосипед', mood: 'нежный' },
  { n: 19, title: 'Малолетки', mood: 'ностальгия' },
  { n: 20, title: 'Урод', mood: 'горький' },
  { n: 21, title: 'Сигареты', mood: 'ностальгия' },
  { n: 22, title: 'Неудобно', mood: 'грустный' },
  { n: 23, title: 'Тетрадь', mood: 'задумчивый' },
  { n: 24, title: 'Ванна, красный пол', mood: 'тёмный' },
  { n: 25, title: 'Все мои поступки', mood: 'хаос' },
  { n: 26, title: 'Прыгай, дура!', mood: 'надежда' },
]

// Русский авторский тег → наша таксономия плюс визуальный пресет.
// Префикс melancholic_ включает God Rays (Atlas проверяет startsWith).
const MOOD_PRESETS = {
  злой: {
    mood: 'aggressive_grunge',
    tempo_bpm: 132,
    energy: 0.88,
    color_palette: { background: '#0d0101', primary: '#ff0055', secondary: '#39ff14' },
    shader_presets: { noise_type: 'turbulent_glitch', outline_thickness: 0.06, bloom_intensity: 1.4 },
  },
  страшный: {
    mood: 'aggressive_industrial',
    tempo_bpm: 120,
    energy: 0.75,
    color_palette: { background: '#050408', primary: '#7a00cc', secondary: '#00ffcc' },
    shader_presets: { noise_type: 'turbulent_glitch', outline_thickness: 0.07, bloom_intensity: 1.6 },
  },
  напряжённый: {
    mood: 'aggressive_tense',
    tempo_bpm: 126,
    energy: 0.8,
    color_palette: { background: '#0a0a0d', primary: '#ff6600', secondary: '#ffcc00' },
    shader_presets: { noise_type: 'turbulent_glitch', outline_thickness: 0.05, bloom_intensity: 1.3 },
  },
  хаос: {
    mood: 'aggressive_chaos',
    tempo_bpm: 145,
    energy: 0.95,
    color_palette: { background: '#0d0008', primary: '#ff00aa', secondary: '#00e5ff' },
    shader_presets: { noise_type: 'turbulent_glitch', outline_thickness: 0.08, bloom_intensity: 1.8 },
  },
  грустный: {
    mood: 'melancholic_sad',
    tempo_bpm: 88,
    energy: 0.28,
    color_palette: { background: '#0f1420', primary: '#7f9dc4', secondary: '#d8e4f0' },
    shader_presets: { noise_type: 'laminar', outline_thickness: 0.02, bloom_intensity: 0.7 },
  },
  мрачный: {
    mood: 'melancholic_grim',
    tempo_bpm: 76,
    energy: 0.22,
    color_palette: { background: '#100a12', primary: '#a05a80', secondary: '#e0c0d0' },
    shader_presets: { noise_type: 'laminar', outline_thickness: 0.03, bloom_intensity: 0.8 },
  },
  задумчивый: {
    mood: 'melancholic_pensive',
    tempo_bpm: 84,
    energy: 0.25,
    color_palette: { background: '#0e1216', primary: '#8fa3ad', secondary: '#e8eef2' },
    shader_presets: { noise_type: 'laminar', outline_thickness: 0.02, bloom_intensity: 0.6 },
  },
  горький: {
    mood: 'melancholic_bitter',
    tempo_bpm: 96,
    energy: 0.4,
    color_palette: { background: '#120d0d', primary: '#c47a6a', secondary: '#f0ddd4' },
    shader_presets: { noise_type: 'laminar', outline_thickness: 0.03, bloom_intensity: 0.9 },
  },
  нежный: {
    mood: 'melancholic_tender',
    tempo_bpm: 92,
    energy: 0.3,
    color_palette: { background: '#1a0f14', primary: '#e8b4c8', secondary: '#f2ede6' },
    shader_presets: { noise_type: 'laminar', outline_thickness: 0.02, bloom_intensity: 0.7 },
  },
  тёмный: {
    mood: 'melancholic_dark',
    tempo_bpm: 80,
    energy: 0.24,
    color_palette: { background: '#08090c', primary: '#5a6a80', secondary: '#c0ccd8' },
    shader_presets: { noise_type: 'laminar', outline_thickness: 0.03, bloom_intensity: 0.8 },
  },
  холодный: {
    mood: 'melancholic_cold',
    tempo_bpm: 82,
    energy: 0.26,
    color_palette: { background: '#0a1014', primary: '#6fb0c4', secondary: '#dff0f5' },
    shader_presets: { noise_type: 'laminar', outline_thickness: 0.02, bloom_intensity: 0.9 },
  },
  мягкий: {
    mood: 'melancholic_soft',
    tempo_bpm: 86,
    energy: 0.2,
    color_palette: { background: '#141014', primary: '#c8b4d8', secondary: '#f0eaf5' },
    shader_presets: { noise_type: 'laminar', outline_thickness: 0.015, bloom_intensity: 0.6 },
  },
  ностальгия: {
    mood: 'melancholic_nostalgic',
    tempo_bpm: 98,
    energy: 0.42,
    color_palette: { background: '#14100a', primary: '#d4a76a', secondary: '#f5ead4' },
    shader_presets: { noise_type: 'laminar', outline_thickness: 0.025, bloom_intensity: 1.0 },
  },
  надежда: {
    mood: 'melancholic_hopeful',
    tempo_bpm: 104,
    energy: 0.5,
    color_palette: { background: '#0c1410', primary: '#7fd4a0', secondary: '#eaf5ee' },
    shader_presets: { noise_type: 'laminar', outline_thickness: 0.02, bloom_intensity: 1.1 },
  },
}

mkdirSync(TARGET_AUDIO_DIR, { recursive: true })
mkdirSync(TARGET_PROFILE_DIR, { recursive: true })

const trackIds = []
let sourceBytes = 0
let targetBytes = 0

for (const { n, title, mood } of TRACKS) {
  const preset = MOOD_PRESETS[mood]
  if (!preset) throw new Error(`No preset mapped for mood "${mood}" (track ${n})`)

  const padded = String(n).padStart(2, '0')
  const sourceAudio = join(SOURCE_AUDIO_DIR, `${padded}.mp3`)
  const targetAudio = join(TARGET_AUDIO_DIR, `${padded}.mp3`)
  if (!existsSync(sourceAudio)) throw new Error(`Missing source audio: ${sourceAudio}`)

  sourceBytes += statSync(sourceAudio).size
  execFileSync(
    FFMPEG,
    ['-y', '-loglevel', 'error', '-i', sourceAudio, '-codec:a', 'libmp3lame', '-b:a', BITRATE, '-ac', '2', targetAudio],
    { stdio: 'inherit' },
  )
  targetBytes += statSync(targetAudio).size

  const trackId = `cupsize_t${padded}`
  trackIds.push(trackId)

  const profile = {
    track_id: trackId,
    title,
    tempo_bpm: preset.tempo_bpm,
    energy: preset.energy,
    mood: preset.mood,
    color_palette: preset.color_palette,
    shader_presets: preset.shader_presets,
    lyrics_ref: `cupsize/track-${padded}.json`,
    audio_src: `cupsize/${padded}.mp3`,
  }
  writeFileSync(join(TARGET_PROFILE_DIR, `${trackId}.json`), `${JSON.stringify(profile, null, 2)}\n`, 'utf8')
  process.stdout.write(`  ${padded} ${title}\n`)
}

const artistPath = join(projectRoot, 'src/data/artists/cupsize.json')
const artist = JSON.parse(readFileSync(artistPath, 'utf8'))
artist.track_ids = trackIds
writeFileSync(artistPath, `${JSON.stringify(artist, null, 2)}\n`, 'utf8')

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1)
console.log(`\nImported ${trackIds.length} Cupsize tracks.`)
console.log(`Audio: ${mb(sourceBytes)} MB source -> ${mb(targetBytes)} MB at ${BITRATE}.`)
