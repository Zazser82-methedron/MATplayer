import { useEffect, useState } from 'react'
import { searchLibraryEntries, formatMood, groupEntriesByAlbum } from '../lib/library/buildLibrary.js'
import { IconClose, IconStar } from './icons.jsx'

export function Library({
  entries,
  activeArtistId,
  activeTrackId,
  isOpen,
  onClose,
  onSelectTrack,
  favorites = [],
  onToggleFavorite,
}) {
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
  const groups = groupEntriesByAlbum(results)

  return (
    <div className="library-panel" role="dialog" aria-label="Library">
      <div className="library-panel__header">
        <input
          type="search"
          className="library-panel__search"
          placeholder="Поиск трека, альбома или артиста…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search library"
          autoFocus
        />
        <button type="button" className="library-panel__close" onClick={onClose} aria-label="Close library">
          <IconClose />
        </button>
      </div>
      <ul className="library-panel__list">
        {results.length === 0 && <li className="library-panel__empty">No tracks found</li>}
        {groups.map((group) => (
          <li key={group.albumId ?? group.artistName}>
            {group.albumTitle && (
              <div className="library-panel__album">
                {group.artistName} · {group.albumTitle}
              </div>
            )}
            <ul className="library-panel__list library-panel__list--nested">
              {group.entries.map((entry, index) => {
                const isActive = entry.artistId === activeArtistId && entry.trackId === activeTrackId
                return (
                  <li key={entry.trackId} className="library-panel__item">
                    <button
                      type="button"
                      className="library-panel__row"
                      aria-current={isActive ? 'true' : undefined}
                      onClick={() => onSelectTrack(entry.artistId, entry.trackId)}
                    >
                      {/* Внутри альбома показываем номер, а не имя артиста:
                          оно уже стоит в заголовке группы и повторять его
                          в каждой строке — лишний шум. */}
                      <span className="library-panel__index">{group.albumTitle ? index + 1 : ''}</span>
                      <span className="library-panel__title">{entry.title}</span>
                      <span className="library-panel__mood">{formatMood(entry.mood)}</span>
                    </button>
                    <button
                      type="button"
                      className="library-panel__fav"
                      aria-pressed={favorites.includes(entry.trackId)}
                      aria-label={`Favorite ${entry.title}`}
                      onClick={() => onToggleFavorite?.(entry.trackId)}
                    >
                      <IconStar filled={favorites.includes(entry.trackId)} />
                    </button>
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}
