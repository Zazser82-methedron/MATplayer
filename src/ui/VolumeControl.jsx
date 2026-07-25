export function VolumeControl({ uiVolume, isMuted, onChange, onToggleMute }) {
  return (
    <span className="volume-control">
      <button type="button" onClick={onToggleMute} aria-pressed={isMuted} aria-label="Mute">
        {isMuted ? '🔇' : '🔊'}
      </button>
      <input
        type="range"
        className="volume-control__slider"
        min="0"
        max="1"
        step="0.01"
        value={uiVolume}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label="Volume"
      />
    </span>
  )
}
