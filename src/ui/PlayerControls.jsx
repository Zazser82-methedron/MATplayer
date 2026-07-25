import { usePlayerStore } from '../store/usePlayerStore.js'

export function PlayerControls({ artistName, isPlaying, onTogglePlay, onNextArtist }) {
  const uxMode = usePlayerStore((s) => s.uxMode)

  if (uxMode !== 'utility') return null

  return (
    <div className="player-controls" role="toolbar" aria-label="Player controls">
      <span className="player-controls__artist">{artistName}</span>
      <button type="button" onClick={onTogglePlay}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <button type="button" onClick={onNextArtist}>
        Next artist
      </button>
    </div>
  )
}
