import { usePlayerStore } from '../store/usePlayerStore.js'
import { VolumeControl } from './VolumeControl.jsx'

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
  uiVolume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  repeatMode,
  onCycleRepeat,
  isShuffled,
  onToggleShuffle,
  isQueueOpen,
  onToggleQueue,
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
      <button type="button" onClick={onToggleShuffle} aria-pressed={isShuffled} aria-label="Shuffle">
        🔀
      </button>
      <button type="button" onClick={onCycleRepeat} aria-label={`Repeat: ${repeatMode}`}>
        {repeatMode === 'one' ? '🔂' : '🔁'}
      </button>
      <button type="button" onClick={onToggleQueue} aria-pressed={isQueueOpen}>
        Queue
      </button>
      <VolumeControl
        uiVolume={uiVolume}
        isMuted={isMuted}
        onChange={onVolumeChange}
        onToggleMute={onToggleMute}
      />
      <button type="button" onClick={onToggleLibrary} aria-pressed={isLibraryOpen}>
        Library
      </button>
    </div>
  )
}
