import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Library } from './Library.jsx'

const entries = [
  { artistId: 'cupsize', artistName: 'Cupsize', trackId: 'cupsize_zppp', title: 'ЗПППП', mood: 'aggressive_grunge' },
  {
    artistId: 'placeholder_b',
    artistName: 'Demo Artist B',
    trackId: 'placeholder_b_01',
    title: 'Halo',
    mood: 'melancholic_dreampop',
  },
]

function renderLibrary(overrides = {}) {
  return render(
    <Library
      entries={entries}
      activeArtistId="cupsize"
      activeTrackId="cupsize_zppp"
      isOpen
      onClose={() => {}}
      onSelectTrack={() => {}}
      {...overrides}
    />,
  )
}

describe('Library', () => {
  it('renders nothing when closed', () => {
    render(<Library entries={entries} isOpen={false} onClose={() => {}} onSelectTrack={() => {}} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('lists every entry and marks the active track', () => {
    renderLibrary()
    expect(screen.getByText('ЗПППП')).toBeInTheDocument()
    expect(screen.getByText('Halo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ЗПППП/ })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: /Halo/ })).not.toHaveAttribute('aria-current')
  })

  it('filters the list as the user types in the search box', () => {
    renderLibrary()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search library' }), { target: { value: 'halo' } })
    expect(screen.queryByText('ЗПППП')).toBeNull()
    expect(screen.getByText('Halo')).toBeInTheDocument()
  })

  it('shows an empty state when nothing matches', () => {
    renderLibrary()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search library' }), {
      target: { value: 'nonexistent track' },
    })
    expect(screen.getByText('No tracks found')).toBeInTheDocument()
  })

  it('calls onSelectTrack with artist and track id when a row is clicked', () => {
    const onSelectTrack = vi.fn()
    renderLibrary({ onSelectTrack })
    fireEvent.click(screen.getByRole('button', { name: /Halo/ }))
    expect(onSelectTrack).toHaveBeenCalledWith('placeholder_b', 'placeholder_b_01')
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    renderLibrary({ onClose })
    fireEvent.click(screen.getByRole('button', { name: 'Close library' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    renderLibrary({ onClose })
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
