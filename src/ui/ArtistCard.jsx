import { useEffect } from 'react'
import { formatMood } from '../lib/library/buildLibrary.js'
import { IconClose } from './icons.jsx'

export function ArtistCard({ artist, tracks, isOpen, onClose, onSelectTrack }) {
  useEffect(() => {
    if (!isOpen) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="artist-card" role="dialog" aria-label={`About ${artist.name}`}>
      <div className="artist-card__header">
        <h2 className="artist-card__name">{artist.name}</h2>
        <button type="button" onClick={onClose} aria-label="Close artist card">
          <IconClose />
        </button>
      </div>
      {artist.bio && <p className="artist-card__bio">{artist.bio}</p>}
      <p className="artist-card__count">{tracks.length} tracks</p>
      <ul className="artist-card__list">
        {tracks.map((track) => (
          <li key={track.trackId}>
            <button type="button" className="artist-card__row" onClick={() => onSelectTrack(track.trackId)}>
              <span className="artist-card__title">{track.title}</span>
              <span className="artist-card__mood">{formatMood(track.mood)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
