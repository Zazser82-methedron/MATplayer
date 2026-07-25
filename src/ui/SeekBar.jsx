export function formatTimestamp(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const minutes = Math.floor(total / 60)
  return `${minutes}:${String(total % 60).padStart(2, '0')}`
}

export function SeekBar({ currentTime, duration, peaks, onSeek }) {
  const safeDuration = duration > 0 ? duration : 0
  const progress = safeDuration > 0 ? currentTime / safeDuration : 0

  return (
    <div className="seek-bar">
      <span className="seek-bar__time">{formatTimestamp(currentTime)}</span>
      <span className="seek-bar__track">
        <span className="seek-bar__peaks" aria-hidden="true">
          {peaks.map((peak, index) => (
            <span
              key={index}
              className="seek-bar__peak"
              data-played={index / Math.max(1, peaks.length) <= progress ? 'true' : undefined}
              style={{ height: `${Math.max(6, peak * 100)}%` }}
            />
          ))}
        </span>
        <input
          type="range"
          className="seek-bar__input"
          min="0"
          max={safeDuration || 1}
          step="0.1"
          value={Math.min(currentTime, safeDuration || 1)}
          onChange={(event) => onSeek(Number(event.target.value))}
          aria-label="Seek"
          aria-valuenow={Math.round(currentTime)}
          aria-valuemin={0}
          aria-valuemax={Math.round(safeDuration)}
        />
      </span>
      <span className="seek-bar__time">{formatTimestamp(safeDuration)}</span>
    </div>
  )
}
