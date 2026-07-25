import { usePlayerStore } from '../store/usePlayerStore.js'

export function PlayerControls({
  artistName,
  trackTitle,
  isPlaying,
  onTogglePlay,
  onNextArtist,
  onPrevTrack,
  onNextTrack,
  isLibraryOpen,
  onToggleLibrary,
}) {
  const uxMode = usePlayerStore((s) => s.uxMode)

  if (uxMode !== 'utility') return null

  return (
    <div className="player-controls" role="toolbar" aria-label="Player controls">
      <span className="player-controls__meta">
        <span className="player-controls__track">{trackTitle}</span>
        <span className="player-controls__artist">{artistName}</span>
      </span>
      <button type="button" onClick={onPrevTrack} aria-label="Previous track">
        ⏮
      </button>
      <button type="button" onClick={onTogglePlay}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <button type="button" onClick={onNextTrack} aria-label="Next track">
        ⏭
      </button>
      <button type="button" onClick={onNextArtist}>
        Next artist
      </button>
      <button type="button" onClick={onToggleLibrary} aria-pressed={isLibraryOpen}>
        Library
      </button>
    </div>
  )
}
