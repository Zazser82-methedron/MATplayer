import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ArtistCard } from './ArtistCard.jsx'

const artist = { artist_id: 'cupsize', name: 'Cupsize', bio: 'Панк-проект из Петербурга.' }
const tracks = [
  { trackId: 't1', title: 'One', mood: 'aggressive_grunge' },
  { trackId: 't2', title: 'Two', mood: 'melancholic_sad' },
]

function renderCard(overrides = {}) {
  return render(
    <ArtistCard
      artist={artist}
      tracks={tracks}
      isOpen
      onClose={() => {}}
      onSelectTrack={() => {}}
      {...overrides}
    />,
  )
}

describe('ArtistCard', () => {
  it('renders nothing when closed', () => {
    render(<ArtistCard artist={artist} tracks={tracks} isOpen={false} onClose={() => {}} onSelectTrack={() => {}} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('shows the artist name, bio and track count', () => {
    renderCard()
    expect(screen.getByRole('heading', { name: 'Cupsize' })).toBeInTheDocument()
    expect(screen.getByText('Панк-проект из Петербурга.')).toBeInTheDocument()
    expect(screen.getByText('2 tracks')).toBeInTheDocument()
  })

  it('lists the discography with readable moods and reports picks', () => {
    const onSelectTrack = vi.fn()
    renderCard({ onSelectTrack })
    expect(screen.getByText('Melancholic Sad')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Two/ }))
    expect(onSelectTrack).toHaveBeenCalledWith('t2')
  })

  it('closes on the close button', () => {
    const onClose = vi.fn()
    renderCard({ onClose })
    fireEvent.click(screen.getByRole('button', { name: 'Close artist card' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    renderCard({ onClose })
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not listen for Escape while closed', () => {
    const onClose = vi.fn()
    render(<ArtistCard artist={artist} tracks={tracks} isOpen={false} onClose={onClose} onSelectTrack={() => {}} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('renders fine when the artist has no bio', () => {
    renderCard({ artist: { ...artist, bio: undefined } })
    expect(screen.getByRole('heading', { name: 'Cupsize' })).toBeInTheDocument()
  })
})
