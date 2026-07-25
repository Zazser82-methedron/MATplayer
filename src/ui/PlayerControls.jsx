import { useEffect, useRef, useState } from 'react'
import { usePlayerStore } from '../store/usePlayerStore.js'

// На виду только то, что нажимают постоянно: play, переключение трека и
// избранное. Остальное (очередь, shuffle, repeat, громкость, шеринг,
// библиотека) уходит под «…» — так устроены все крупные плееры, и именно
// из-за девяти кнопок в ряд панель выглядела кашей.
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
      <div className="player-bar__meta">
        <span className="player-bar__track">{trackTitle}</span>
        <span className="player-bar__sub">
          {artistName}
          {albumTitle ? ` · ${albumTitle}` : ''}
        </span>
      </div>

      <div className="player-bar__transport">
        <button type="button" className="player-bar__icon" onClick={onPrevTrack} aria-label="Previous track">
          ⏮
        </button>
        <button
          type="button"
          className="player-bar__play"
          onClick={onTogglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>
        <button type="button" className="player-bar__icon" onClick={onNextTrack} aria-label="Next track">
          ⏭
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
          {isFavorite ? '★' : '☆'}
        </button>
        <button
          type="button"
          className="player-bar__icon"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-label="More controls"
        >
          ⋯
        </button>

        {isMenuOpen && (
          <div className="player-menu" role="menu">
            <button type="button" role="menuitem" onClick={() => { onOpenLibrary(); setIsMenuOpen(false) }}>
              Библиотека
            </button>
            <button type="button" role="menuitem" onClick={() => { onOpenQueue(); setIsMenuOpen(false) }}>
              Очередь
            </button>
            <button type="button" role="menuitem" onClick={() => { onNextArtist(); setIsMenuOpen(false) }}>
              Другой исполнитель
            </button>
            <div className="player-menu__separator" />
            <button type="button" role="menuitem" onClick={onToggleShuffle} aria-pressed={isShuffled}>
              Перемешать{isShuffled ? ' ✓' : ''}
            </button>
            <button type="button" role="menuitem" onClick={onCycleRepeat}>
              Повтор: {{ off: 'выкл', all: 'все', one: 'один' }[repeatMode]}
            </button>
            <div className="player-menu__separator" />
            <label className="player-menu__volume">
              <button
                type="button"
                onClick={onToggleMute}
                aria-pressed={isMuted}
                aria-label="Mute"
                className="player-menu__mute"
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={uiVolume}
                onChange={(event) => onVolumeChange(Number(event.target.value))}
                aria-label="Volume"
              />
            </label>
            <div className="player-menu__separator" />
            <button type="button" role="menuitem" onClick={() => { onShare(); setIsMenuOpen(false) }}>
              Скопировать ссылку
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
