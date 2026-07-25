import { useEffect, useState } from 'react'
import { searchLibraryEntries, formatMood } from '../lib/library/buildLibrary.js'

export function Library({ entries, activeArtistId, activeTrackId, isOpen, onClose, onSelectTrack }) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!isOpen) return undefined
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const results = searchLibraryEntries(entries, query)

  return (
    <div className="library-panel" role="dialog" aria-label="Library">
      <div className="library-panel__header">
        <input
          type="search"
          className="library-panel__search"
          placeholder="Search artists or tracks…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search library"
          autoFocus
        />
        <button type="button" className="library-panel__close" onClick={onClose} aria-label="Close library">
          ✕
        </button>
      </div>
      <ul className="library-panel__list">
        {results.length === 0 && <li className="library-panel__empty">No tracks found</li>}
        {results.map((entry) => {
          const isActive = entry.artistId === activeArtistId && entry.trackId === activeTrackId
          return (
            <li key={entry.trackId}>
              <button
                type="button"
                className="library-panel__row"
                aria-current={isActive ? 'true' : undefined}
                onClick={() => onSelectTrack(entry.artistId, entry.trackId)}
              >
                <span className="library-panel__title">{entry.title}</span>
                <span className="library-panel__artist">{entry.artistName}</span>
                <span className="library-panel__mood">{formatMood(entry.mood)}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
