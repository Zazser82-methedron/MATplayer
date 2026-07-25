import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Atlas } from './three/Atlas.jsx'
import { PerformanceManager } from './hooks/usePerformanceDegradation.js'
import { UXModeManager } from './ui/UXModeManager.jsx'
import { PlayerControls } from './ui/PlayerControls.jsx'
import { LyricsOverlay } from './ui/LyricsOverlay.jsx'
import { Library } from './ui/Library.jsx'
import { useAudioAnalyser } from './hooks/useAudioAnalyser.js'
import { useAudioPlaybackSync } from './hooks/useAudioPlaybackSync.js'
import { useSwipeGestures } from './hooks/useSwipeGestures.js'
import { useReducedMotion } from './hooks/useReducedMotion.js'
import { computePortraitCameraAdjustment } from './three/portraitAdaptation.js'
import { usePlayerStore } from './store/usePlayerStore.js'
import { ARTISTS, TRACKS_BY_ID, resolveLyrics } from './data/index.js'
import { buildLibraryEntries } from './lib/library/buildLibrary.js'
import { pickReadableTextColor } from './lib/color/contrast.js'
import { uiVolumeToGain, clampVolume } from './lib/player/volume.js'
import { QueuePanel } from './ui/QueuePanel.jsx'
import { nextRepeatMode, computeNextIndex, buildShuffledOrder } from './lib/player/queue.js'
import { parseDeepLink, buildDeepLinkSearch } from './lib/player/deepLink.js'
import { analyzeTrack } from './lib/audio/analyzeTrack.js'
import { SeekBar } from './ui/SeekBar.jsx'

const WAVEFORM_BUCKETS = 160

const DEFAULT_ARTIST_ID = 'cupsize'
const DEFAULT_TRACK_ID = 'cupsize_zppp'
const BASE_CAMERA_POSITION = { x: 0, y: 1, z: 5 }
const SEEK_SECONDS = 5
const VOLUME_STEP = 0.1

function findArtist(artistId) {
  return ARTISTS.find((a) => a.artist_id === artistId) ?? ARTISTS.find((a) => a.artist_id === DEFAULT_ARTIST_ID)
}

function switchArtist(direction) {
  const ids = ARTISTS.map((a) => a.artist_id)
  const currentIndex = ids.indexOf(usePlayerStore.getState().currentArtistId)
  const nextIndex = (currentIndex + direction + ids.length) % ids.length
  const nextArtist = ARTISTS[nextIndex]
  usePlayerStore.getState().setArtist(nextArtist.artist_id)
  usePlayerStore.getState().setTrack(nextArtist.track_ids[0])
}

// Возвращает id трека, на который нужно перейти, либо null, если переходить
// некуда. Возврат того же id, что и текущий, — валидный ответ (repeat: one
// либо repeat: all у артиста с единственным треком); вызывающий код обязан
// такой случай обработать перемоткой, а не setTrack.
function resolveNextTrackId(direction, { ignoreRepeatOne = false } = {}) {
  const store = usePlayerStore.getState()
  const artist = findArtist(store.currentArtistId)
  const ids = artist.track_ids
  if (ids.length === 0) return null
  // При включённом shuffle порядок обхода берётся из перемешанной
  // последовательности, но сам список треков артиста не трогается —
  // выключение shuffle возвращает исходный порядок альбома.
  const order =
    store.isShuffled && store.shuffledOrder.length === ids.length
      ? store.shuffledOrder
      : ids.map((_, i) => i)
  const currentIndex = ids.indexOf(store.currentTrackId)
  // Текущий трек не принадлежит этому артисту (битая ссылка, рассинхрон) —
  // начинаем обход с начала, а не скармливаем -1 в арифметику индексов.
  if (currentIndex === -1) return ids[order[0]]
  const repeatMode = ignoreRepeatOne && store.repeatMode === 'one' ? 'all' : store.repeatMode
  const nextPosition = computeNextIndex(order.indexOf(currentIndex), order.length, repeatMode, direction)
  if (nextPosition === null) return null
  return ids[order[nextPosition]]
}

function switchTrack(direction) {
  // Ручное нажатие ⏮/⏭ игнорирует repeat: one. Иначе кнопки становятся
  // полностью мёртвыми: computeNextIndex вернул бы текущий индекс, setTrack
  // записал бы тот же id, зависимости эффекта загрузки не изменились бы и
  // ничего не произошло — без какой-либо обратной связи пользователю.
  const nextId = resolveNextTrackId(direction, { ignoreRepeatOne: true })
  if (nextId === null) return
  usePlayerStore.getState().setTrack(nextId)
}

function selectTrack(artistId, trackId) {
  const store = usePlayerStore.getState()
  store.setArtist(artistId)
  store.setTrack(trackId)
}

export default function App() {
  const audioRef = useRef(null)
  const currentArtistId = usePlayerStore((s) => s.currentArtistId)
  const currentTrackId = usePlayerStore((s) => s.currentTrackId)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const reducedMotion = useReducedMotion()
  const [cameraPosition, setCameraPosition] = useState(BASE_CAMERA_POSITION)
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const [uiVolume, setUiVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isQueueOpen, setIsQueueOpen] = useState(false)
  const [peaks, setPeaks] = useState([])
  const [duration, setDuration] = useState(0)
  // Подписка на целые секунды, а не на сырое currentTime: сырое значение
  // пишется каждый кадр анимации, и App (вместе со всем поддеревом <Canvas>,
  // которое R3F не изолирует) переспрашивался бы 60 раз в секунду. Шкала
  // показывает мм:сс, а одна полоска waveform покрывает почти секунду —
  // разницы на глаз нет.
  const currentSecond = usePlayerStore((s) => Math.floor(s.currentTime))
  const uxMode = usePlayerStore((s) => s.uxMode)
  const repeatMode = usePlayerStore((s) => s.repeatMode)
  const isShuffled = usePlayerStore((s) => s.isShuffled)
  const favorites = usePlayerStore((s) => s.favorites)
  useAudioAnalyser(audioRef)
  useAudioPlaybackSync(audioRef)

  const libraryEntries = useMemo(() => buildLibraryEntries(ARTISTS, TRACKS_BY_ID), [])

  // Стартовое состояние: из deep-link, если он валиден, иначе дефолт.
  // Тайм-код применяется отдельно, в обработчике loadedmetadata — до
  // загрузки метаданных установка currentTime молча игнорируется браузером.
  const pendingStartTimeRef = useRef(null)

  useEffect(() => {
    const { artistId, trackId, startTime } = parseDeepLink(window.location.search)
    // Артист и трек проверяются не по отдельности, а как пара: ссылка вида
    // ?artist=cupsize&track=placeholder_b_01 иначе принималась бы буквально,
    // и палитра, подсветка в библиотеке и карта Atlas разошлись бы с тем,
    // что реально звучит. Владельца трека вычисляем сами.
    const owner = TRACKS_BY_ID[trackId] ? ARTISTS.find((a) => a.track_ids.includes(trackId)) : undefined
    const resolvedArtistId = owner?.artist_id ?? (ARTISTS.some((a) => a.artist_id === artistId) ? artistId : null)
    const resolvedTrackId = owner ? trackId : findArtist(resolvedArtistId).track_ids[0]

    usePlayerStore.getState().setArtist(resolvedArtistId ?? DEFAULT_ARTIST_ID)
    usePlayerStore.getState().setTrack(resolvedTrackId ?? DEFAULT_TRACK_ID)
    pendingStartTimeRef.current = owner ? startTime : null
  }, [])

  useEffect(() => {
    const audioEl = audioRef.current
    if (!audioEl) return undefined
    const applyStartTime = () => {
      if (pendingStartTimeRef.current !== null) {
        audioEl.currentTime = pendingStartTimeRef.current
        pendingStartTimeRef.current = null
      }
    }
    audioEl.addEventListener('loadedmetadata', applyStartTime)
    return () => audioEl.removeEventListener('loadedmetadata', applyStartTime)
  }, [])

  useEffect(() => {
    function updateCamera() {
      setCameraPosition(
        computePortraitCameraAdjustment(BASE_CAMERA_POSITION, window.innerWidth, window.innerHeight),
      )
    }
    updateCamera()
    window.addEventListener('resize', updateCamera)
    return () => window.removeEventListener('resize', updateCamera)
  }, [])

  useEffect(() => {
    function handleKeyDown(event) {
      const audioEl = audioRef.current
      if (event.key === 'n') {
        switchArtist(1)
      } else if (event.key === ' ') {
        event.preventDefault()
        if (!audioEl) return
        if (audioEl.paused) audioEl.play()
        else audioEl.pause()
      } else if (event.key === 'ArrowRight') {
        if (audioEl) audioEl.currentTime += SEEK_SECONDS
      } else if (event.key === 'ArrowLeft') {
        if (audioEl) audioEl.currentTime = Math.max(0, audioEl.currentTime - SEEK_SECONDS)
      } else if (event.key === 'ArrowUp') {
        setUiVolume((v) => clampVolume(v + VOLUME_STEP))
      } else if (event.key === 'ArrowDown') {
        setUiVolume((v) => clampVolume(v - VOLUME_STEP))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useSwipeGestures({
    onSwipeLeft: () => switchArtist(1),
    onSwipeRight: () => switchArtist(-1),
    onDoubleTap: () => {
      const audioEl = audioRef.current
      if (!audioEl) return
      if (audioEl.paused) audioEl.play()
      else audioEl.pause()
    },
  })

  const activeArtist = findArtist(currentArtistId)
  const activeTrack = TRACKS_BY_ID[currentTrackId] ?? TRACKS_BY_ID[DEFAULT_TRACK_ID]
  const activeLyrics = resolveLyrics(activeTrack.lyrics_ref)
  const trackByArtistId = { [activeArtist.artist_id]: activeTrack }

  // Auto-advance to the next track when one ends, instead of looping the
  // same track forever — matches expected library/player behaviour.
  useEffect(() => {
    const audioEl = audioRef.current
    if (!audioEl) return undefined
    const handleEnded = () => {
      const store = usePlayerStore.getState()
      const nextId = resolveNextTrackId(1)
      if (nextId === null) return
      // Следующий трек совпал с текущим (repeat: one либо repeat: all у
      // артиста с единственным треком). setTrack тут бесполезен — id не
      // изменится, зависимости эффекта загрузки останутся прежними и
      // воспроизведение просто оборвётся. Перематываем вручную.
      if (nextId === store.currentTrackId) {
        audioEl.currentTime = 0
        audioEl.play().catch(() => {})
        return
      }
      store.setTrack(nextId)
    }
    audioEl.addEventListener('ended', handleEnded)
    return () => audioEl.removeEventListener('ended', handleEnded)
  }, [])

  // Changing the `src` attribute on an existing <audio> element doesn't make
  // the browser pick it up on its own — it needs an explicit reload. By the
  // time a track switch happens the user has already interacted with the
  // page, so autoplay restrictions won't block the resulting play() call.
  useEffect(() => {
    const audioEl = audioRef.current
    // На первом рендере трек ещё не выбран (эффект инициализации отработает
    // следом), а activeTrack подставлен дефолтом. Без этой проверки каждая
    // загрузка страницы писала бы дефолтный трек в сохраняемую историю и
    // тянула его mp3, чтобы тут же оборвать закачку.
    if (!audioEl || !currentTrackId) return
    audioEl.load()
    audioEl.play().catch(() => {})
    usePlayerStore.getState().recordPlay(activeTrack.track_id)
  }, [currentTrackId, activeTrack.audio_src, activeTrack.track_id])

  // Один декод файла закрывает сразу две задачи: BPM для пульсаций и пики
  // для waveform. Воспроизведение остаётся на <audio> ради нативного
  // стриминга, поэтому файл скачивается вторично — осознанный размен, полный
  // переход на AudioBufferSourceNode стоил бы прогрессивного воспроизведения.
  // Анализ необязателен: при сбое остаётся tempo_bpm из профиля трека.
  const audioSrc = currentTrackId ? `${import.meta.env.BASE_URL}audio/${activeTrack.audio_src}` : null
  useEffect(() => {
    usePlayerStore.getState().setDetectedBpm(activeTrack.tempo_bpm ?? null)
    usePlayerStore.getState().setBeatOffset(0)
    setPeaks([])
    // Длительность тоже сбрасываем: без этого между сменой трека и его
    // loadedmetadata шкала показывала бы длину предыдущего трека рядом с
    // позицией нового.
    setDuration(0)
    if (!audioSrc) return undefined

    const context = audioRef.current?.__matplayerContext
    if (!context) return undefined

    // Прокликивание десяти треков подряд без отмены запускало бы десять
    // параллельных загрузок по ~6 МБ и десять декодирований.
    const controller = new AbortController()
    analyzeTrack(audioSrc, context, WAVEFORM_BUCKETS, { signal: controller.signal })
      .then(({ peaks: trackPeaks, bpm, beatOffset }) => {
        if (controller.signal.aborted) return
        setPeaks(trackPeaks)
        usePlayerStore.getState().setDetectedBpm(bpm)
        usePlayerStore.getState().setBeatOffset(beatOffset)
      })
      .catch(() => {
        // Профильный tempo_bpm уже выставлен выше — этого достаточно,
        // визуал просто останется без waveform.
      })

    return () => controller.abort()
  }, [audioSrc, activeTrack.tempo_bpm])

  useEffect(() => {
    const audioEl = audioRef.current
    if (!audioEl) return undefined
    const readDuration = () => setDuration(audioEl.duration || 0)
    audioEl.addEventListener('loadedmetadata', readDuration)
    return () => audioEl.removeEventListener('loadedmetadata', readDuration)
  }, [])

  // Громкость применяется через перцептивную кривую и переживает смену трека:
  // audioEl.load() сбрасывает не всё, а состояние mute живёт только здесь.
  useEffect(() => {
    const audioEl = audioRef.current
    if (!audioEl) return
    audioEl.volume = isMuted ? 0 : uiVolumeToGain(uiVolume)
  }, [uiVolume, isMuted, activeTrack.audio_src])

  return (
    <div id="matplayer-root">
      {/* Hidden test hook — lets the Playwright smoke test observe the current artist
          without reaching into React/Zustand internals. Not user-facing UI. */}
      <div data-testid="current-artist" data-artist-id={currentArtistId ?? ''} hidden />
      <UXModeManager />
      {/* src не выставляется, пока трек не выбран — иначе браузер начинает
          качать дефолтный mp3 ещё до того, как отработает разбор deep-link,
          и тут же бросает закачку. */}
      <audio ref={audioRef} src={audioSrc ?? undefined} autoPlay crossOrigin="anonymous" />
      <Canvas
        camera={{ position: [cameraPosition.x, cameraPosition.y, cameraPosition.z], fov: 50 }}
        onCreated={() => {
          document.documentElement.dataset.matplayerReady = 'true'
        }}
      >
        <PerformanceManager />
        <Atlas artists={ARTISTS} trackByArtistId={trackByArtistId} />
      </Canvas>
      <LyricsOverlay
        lines={activeLyrics}
        reducedMotion={reducedMotion}
        textColor={pickReadableTextColor(activeTrack.color_palette.background)}
      />
      {uxMode === 'utility' && (
        <SeekBar
          currentTime={currentSecond}
          duration={duration}
          peaks={peaks}
          onSeek={(time) => {
            if (audioRef.current) audioRef.current.currentTime = time
          }}
        />
      )}
      <PlayerControls
        artistName={activeArtist.name}
        trackTitle={activeTrack.title ?? ''}
        isPlaying={isPlaying}
        onTogglePlay={() => {
          const audioEl = audioRef.current
          if (!audioEl) return
          if (audioEl.paused) audioEl.play()
          else audioEl.pause()
        }}
        onNextArtist={() => switchArtist(1)}
        onPrevTrack={() => switchTrack(-1)}
        onNextTrack={() => switchTrack(1)}
        uiVolume={uiVolume}
        isMuted={isMuted}
        onVolumeChange={setUiVolume}
        onToggleMute={() => setIsMuted((muted) => !muted)}
        repeatMode={repeatMode}
        onCycleRepeat={() => usePlayerStore.getState().setRepeatMode(nextRepeatMode(repeatMode))}
        isShuffled={isShuffled}
        onToggleShuffle={() => {
          const store = usePlayerStore.getState()
          if (store.isShuffled) {
            store.setShuffle(false, [])
            return
          }
          const trackIds = activeArtist.track_ids
          const currentIndex = trackIds.indexOf(activeTrack.track_id)
          store.setShuffle(true, buildShuffledOrder(trackIds.length, Math.random, currentIndex))
        }}
        isQueueOpen={isQueueOpen}
        onToggleQueue={() => setIsQueueOpen((open) => !open)}
        onShare={() => {
          const search = buildDeepLinkSearch(
            activeArtist.artist_id,
            activeTrack.track_id,
            audioRef.current?.currentTime ?? 0,
          )
          navigator.clipboard?.writeText(`${window.location.origin}${window.location.pathname}${search}`)
        }}
        isLibraryOpen={isLibraryOpen}
        onToggleLibrary={() => setIsLibraryOpen((open) => !open)}
      />
      <QueuePanel
        entries={libraryEntries.filter((e) => e.artistId === activeArtist.artist_id)}
        isOpen={isQueueOpen}
        activeTrackId={activeTrack.track_id}
        onSelect={(trackId) => {
          usePlayerStore.getState().setTrack(trackId)
          setIsQueueOpen(false)
        }}
        onClose={() => setIsQueueOpen(false)}
      />
      <Library
        entries={libraryEntries}
        activeArtistId={activeArtist.artist_id}
        activeTrackId={activeTrack.track_id}
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectTrack={(artistId, trackId) => {
          selectTrack(artistId, trackId)
          setIsLibraryOpen(false)
        }}
        favorites={favorites}
        onToggleFavorite={(trackId) => usePlayerStore.getState().toggleFavorite(trackId)}
      />
    </div>
  )
}
