import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PlayerControls } from './PlayerControls.jsx'
import { usePlayerStore } from '../store/usePlayerStore.js'

function renderControls(overrides = {}) {
  const noop = () => {}
  return render(
    <PlayerControls
      artistName="Cupsize"
      albumTitle="ЗМП"
      trackTitle="Семнадцать ножевых"
      isPlaying={false}
      isFavorite={false}
      onTogglePlay={noop}
      onToggleFavorite={noop}
      onPrevTrack={noop}
      onNextTrack={noop}
      onNextArtist={noop}
      onOpenLibrary={noop}
      onOpenQueue={noop}
      onShare={noop}
      repeatMode="off"
      onCycleRepeat={noop}
      isShuffled={false}
      onToggleShuffle={noop}
      uiVolume={1}
      isMuted={false}
      onVolumeChange={noop}
      onToggleMute={noop}
      {...overrides}
    />,
  )
}

describe('PlayerControls', () => {
  beforeEach(() => {
    usePlayerStore.setState({ uxMode: 'utility' })
  })

  it('renders nothing outside utility mode', () => {
    usePlayerStore.setState({ uxMode: 'focus' })
    renderControls()
    expect(screen.queryByRole('toolbar')).toBeNull()
  })

  it('shows track, artist and album', () => {
    renderControls()
    expect(screen.getByText('Семнадцать ножевых')).toBeInTheDocument()
    expect(screen.getByText('Cupsize · ЗМП')).toBeInTheDocument()
  })

  it('omits the album separator when there is no album', () => {
    renderControls({ albumTitle: null })
    expect(screen.getByText('Cupsize')).toBeInTheDocument()
  })

  it('keeps exactly three transport actions plus favourite and overflow visible', () => {
    renderControls()
    // Именно ради этого панель переделывалась: на виду play, перемотка треков,
    // избранное и «…». Всё остальное не должно висеть в баре.
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous track' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next track' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Favorite this track' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'More controls' })).toBeInTheDocument()
    expect(screen.queryByRole('menu')).toBeNull()
    expect(screen.queryByRole('button', { name: /Библиотека/ })).toBeNull()
  })

  it('reveals the secondary controls only after opening the overflow menu', () => {
    renderControls()
    fireEvent.click(screen.getByRole('button', { name: 'More controls' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Библиотека' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Очередь' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Volume' })).toBeInTheDocument()
  })

  it('reports play, track changes and favourite from the visible row', () => {
    const onTogglePlay = vi.fn()
    const onPrevTrack = vi.fn()
    const onNextTrack = vi.fn()
    const onToggleFavorite = vi.fn()
    renderControls({ onTogglePlay, onPrevTrack, onNextTrack, onToggleFavorite })

    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    fireEvent.click(screen.getByRole('button', { name: 'Previous track' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next track' }))
    fireEvent.click(screen.getByRole('button', { name: 'Favorite this track' }))

    expect(onTogglePlay).toHaveBeenCalledTimes(1)
    expect(onPrevTrack).toHaveBeenCalledTimes(1)
    expect(onNextTrack).toHaveBeenCalledTimes(1)
    expect(onToggleFavorite).toHaveBeenCalledTimes(1)
  })

  it('marks the favourite button as pressed for a favourited track', () => {
    renderControls({ isFavorite: true })
    expect(screen.getByRole('button', { name: 'Favorite this track' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('labels the play button as Pause during playback', () => {
    renderControls({ isPlaying: true })
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
  })

  it('opens the library from the menu and closes the menu afterwards', () => {
    const onOpenLibrary = vi.fn()
    renderControls({ onOpenLibrary })
    fireEvent.click(screen.getByRole('button', { name: 'More controls' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Библиотека' }))
    expect(onOpenLibrary).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('shows the current repeat mode in the menu', () => {
    renderControls({ repeatMode: 'one' })
    fireEvent.click(screen.getByRole('button', { name: 'More controls' }))
    expect(screen.getByRole('menuitem', { name: 'Повтор: один' })).toBeInTheDocument()
  })

  it('closes the menu on Escape', () => {
    renderControls()
    fireEvent.click(screen.getByRole('button', { name: 'More controls' }))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('menu')).toBeNull()
  })
})
