import { useState } from 'react'

export function formatTimestamp(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const minutes = Math.floor(total / 60)
  return `${minutes}:${String(total % 60).padStart(2, '0')}`
}

export function SeekBar({ currentTime, duration, peaks, onSeek }) {
  // Пока пользователь тащит ползунок, позицию показываем локальную. Иначе
  // стор продолжает толкать в него currentTime воспроизведения, а установка
  // audioEl.currentTime применяется асинхронно — ползунок дёргался бы назад
  // прямо под пальцем. Перемотка выполняется один раз, при отпускании.
  const [dragTime, setDragTime] = useState(null)

  const safeDuration = duration > 0 ? duration : 0
  const displayTime = dragTime ?? currentTime
  const progress = safeDuration > 0 ? displayTime / safeDuration : 0

  const commitSeek = () => {
    if (dragTime === null) return
    onSeek(dragTime)
    setDragTime(null)
  }

  return (
    <div className="seek-bar">
      <span className="seek-bar__time">{formatTimestamp(displayTime)}</span>
      <span className="seek-bar__track">
        <span className="seek-bar__peaks" aria-hidden="true">
          {peaks.map((peak, index) => (
            <span
              key={index}
              className="seek-bar__peak"
              data-played={index / Math.max(1, peaks.length) <= progress ? 'true' : undefined}
              style={{ height: `${Math.max(6, Math.min(100, peak * 100))}%` }}
            />
          ))}
        </span>
        <input
          type="range"
          className="seek-bar__input"
          min="0"
          max={safeDuration || 1}
          step="0.1"
          value={Math.min(displayTime, safeDuration || 1)}
          onChange={(event) => setDragTime(Number(event.target.value))}
          onPointerUp={commitSeek}
          onKeyUp={commitSeek}
          onBlur={commitSeek}
          aria-label="Seek"
        />
      </span>
      <span className="seek-bar__time">{formatTimestamp(safeDuration)}</span>
    </div>
  )
}
