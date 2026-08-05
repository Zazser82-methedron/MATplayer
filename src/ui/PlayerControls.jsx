import { useEffect, useRef, useState } from 'react'
import { usePlayerStore } from '../store/usePlayerStore.js'
import { SeekBar } from './SeekBar.jsx'
import { VolumeControl } from './VolumeControl.jsx'
import {
  IconPlay,
  IconPause,
  IconPrev,
  IconNext,
  IconStar,
  IconMore,
  IconShuffle,
  IconRepeat,
  IconQueue,
  IconLink,
} from './icons.jsx'

// На виду только то, что нажимают постоянно: прогресс, play, переключение
// трека и избранное. Остальное (очередь, shuffle, repeat, громкость, шеринг,
// библиотека) уходит под «…» — так устроены все крупные плееры. Шкала
// прогресса раньше была отдельной плавающей капсулой над этой панелью; ни
// один референсный плеер так не делает — теперь это первая строка той же
// панели.
export function PlayerControls({
  artistName,
  albumTitle,
  trackTitle,
  isPlaying,
  isFavorite,
  onTogglePlay,
  onToggleFavorite,
  onPrevTrack,
  onNextTrack,
  onNextArtist,
  onOpenLibrary,
  onOpenQueue,
  onShare,
  repeatMode,
  onCycleRepeat,
  isShuffled,
  onToggleShuffle,
  uiVolume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  currentTime,
  duration,
  peaks,
  onSeek,
}) {
  const uxMode = usePlayerStore((s) => s.uxMode)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!isMenuOpen) return undefined
    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsMenuOpen(false)
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }
    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen])

  if (uxMode !== 'utility') return null

  return (
    <div className="player-bar" role="toolbar" aria-label="Player controls">
      <SeekBar currentTime={currentTime} duration={duration} peaks={peaks} onSeek={onSeek} />

      <div className="player-bar__row">
        <div className="player-bar__meta">
          <span className="player-bar__track">{trackTitle}</span>
          <span className="player-bar__sub">
            {artistName}
            {albumTitle ? ` · ${albumTitle}` : ''}
          </span>
        </div>

        <div className="player-bar__transport">
          <button type="button" className="player-bar__icon" onClick={onPrevTrack} aria-label="Previous track">
            <IconPrev />
          </button>
          <button
            type="button"
            className="player-bar__play"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <IconPause /> : <IconPlay />}
          </button>
          <button type="button" className="player-bar__icon" onClick={onNextTrack} aria-label="Next track">
            <IconNext />
          </button>
        </div>

        <div className="player-bar__end" ref={menuRef}>
          <button
            type="button"
            className="player-bar__icon player-bar__fav"
            onClick={onToggleFavorite}
            aria-pressed={isFavorite}
            aria-label="Favorite this track"
          >
            <IconStar filled={isFavorite} />
          </button>
          <button
            type="button"
            className="player-bar__icon"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-label="More controls"
          >
            <IconMore />
          </button>

          {isMenuOpen && (
            <div className="player-menu" role="menu">
              <button type="button" role="menuitem" onClick={() => { onOpenLibrary(); setIsMenuOpen(false) }}>
                Библиотека
              </button>
              <button type="button" role="menuitem" onClick={() => { onOpenQueue(); setIsMenuOpen(false) }}>
                <IconQueue /> Очередь
              </button>
              <button type="button" role="menuitem" onClick={() => { onNextArtist(); setIsMenuOpen(false) }}>
                Другой исполнитель
              </button>
              <div className="player-menu__separator" />
              <button type="button" role="menuitem" onClick={onToggleShuffle} aria-pressed={isShuffled}>
                <IconShuffle /> Перемешать{isShuffled ? ' ✓' : ''}
              </button>
              <button type="button" role="menuitem" onClick={onCycleRepeat}>
                <IconRepeat mode={repeatMode} /> Повтор: {{ off: 'выкл', all: 'все', one: 'один' }[repeatMode]}
              </button>
              <div className="player-menu__separator" />
              <div className="player-menu__volume">
                <VolumeControl
                  uiVolume={uiVolume}
                  isMuted={isMuted}
                  onChange={onVolumeChange}
                  onToggleMute={onToggleMute}
                />
              </div>
              <div className="player-menu__separator" />
              <button type="button" role="menuitem" onClick={() => { onShare(); setIsMenuOpen(false) }}>
                <IconLink /> Скопировать ссылку
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
