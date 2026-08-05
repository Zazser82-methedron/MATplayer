import { IconClose } from './icons.jsx'

export function QueuePanel({ entries, isOpen, activeTrackId, onSelect, onClose }) {
  if (!isOpen) return null

  return (
    <div className="queue-panel" role="dialog" aria-label="Play queue">
      <div className="queue-panel__header">
        <span>Up next</span>
        <button type="button" onClick={onClose} aria-label="Close queue">
          <IconClose />
        </button>
      </div>
      <ol className="queue-panel__list">
        {entries.map((entry) => (
          <li key={entry.trackId}>
            <button
              type="button"
              className="queue-panel__row"
              aria-current={entry.trackId === activeTrackId ? 'true' : undefined}
              onClick={() => onSelect(entry.trackId)}
            >
              <span className="queue-panel__title">{entry.title}</span>
              <span className="queue-panel__artist">{entry.artistName}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
