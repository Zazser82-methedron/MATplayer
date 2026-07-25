import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PlayerControls } from './PlayerControls.jsx'
import { usePlayerStore } from '../store/usePlayerStore.js'

function renderControls(overrides = {}) {
  const noop = () => {}
  return render(
    <PlayerControls
      artistName="Cupsize"
      trackTitle="ЗПППП"
      isPlaying={false}
      onTogglePlay={noop}
      onNextArtist={noop}
      onPrevTrack={noop}
      onNextTrack={noop}
      isLibraryOpen={false}
      onToggleLibrary={noop}
      uiVolume={1}
      isMuted={false}
      onVolumeChange={noop}
      onToggleMute={noop}
      repeatMode="off"
      onCycleRepeat={noop}
      isShuffled={false}
      onToggleShuffle={noop}
      isQueueOpen={false}
      onToggleQueue={noop}
      onShare={noop}
      {...overrides}
    />,
  )
}

describe('PlayerControls', () => {
  beforeEach(() => {
    usePlayerStore.setState({ uxMode: 'focus' })
  })

  it('renders nothing outside utility mode', () => {
    renderControls()
    expect(screen.queryByRole('toolbar')).toBeNull()
  })

  it('renders track title and artist name in utility mode', () => {
    usePlayerStore.setState({ uxMode: 'utility' })
    renderControls()
    expect(screen.getByText('ЗПППП')).toBeInTheDocument()
    expect(screen.getByText('Cupsize')).toBeInTheDocument()
  })

  it('calls the callbacks on click', () => {
    usePlayerStore.setState({ uxMode: 'utility' })
    const onTogglePlay = vi.fn()
    const onNextArtist = vi.fn()
    const onPrevTrack = vi.fn()
    const onNextTrack = vi.fn()
    const onToggleLibrary = vi.fn()
    renderControls({ onTogglePlay, onNextArtist, onPrevTrack, onNextTrack, onToggleLibrary })

    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    expect(onTogglePlay).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Next artist' }))
    expect(onNextArtist).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Previous track' }))
    expect(onPrevTrack).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Next track' }))
    expect(onNextTrack).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Library' }))
    expect(onToggleLibrary).toHaveBeenCalledTimes(1)
  })

  it('exposes shuffle and repeat state, and cycles repeat on click', () => {
    usePlayerStore.setState({ uxMode: 'utility' })
    const onCycleRepeat = vi.fn()
    const onToggleShuffle = vi.fn()
    renderControls({ isShuffled: true, repeatMode: 'one', onCycleRepeat, onToggleShuffle })

    expect(screen.getByRole('button', { name: 'Shuffle' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Repeat: one' }))
    expect(onCycleRepeat).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Shuffle' }))
    expect(onToggleShuffle).toHaveBeenCalledTimes(1)
  })

  it('reflects library open state via aria-pressed', () => {
    usePlayerStore.setState({ uxMode: 'utility' })
    renderControls({ isLibraryOpen: true })
    expect(screen.getByRole('button', { name: 'Library' })).toHaveAttribute('aria-pressed', 'true')
  })
})
