import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PlayerControls } from './PlayerControls.jsx'
import { usePlayerStore } from '../store/usePlayerStore.js'

describe('PlayerControls', () => {
  beforeEach(() => {
    usePlayerStore.setState({ uxMode: 'focus' })
  })

  it('renders nothing outside utility mode', () => {
    render(<PlayerControls artistName="Cupsize" isPlaying onTogglePlay={() => {}} onNextArtist={() => {}} />)
    expect(screen.queryByRole('toolbar')).toBeNull()
  })

  it('renders controls in utility mode and calls the callbacks on click', () => {
    usePlayerStore.setState({ uxMode: 'utility' })
    const onTogglePlay = vi.fn()
    const onNextArtist = vi.fn()
    render(
      <PlayerControls artistName="Cupsize" isPlaying={false} onTogglePlay={onTogglePlay} onNextArtist={onNextArtist} />,
    )
    expect(screen.getByRole('toolbar')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    expect(onTogglePlay).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Next artist' }))
    expect(onNextArtist).toHaveBeenCalledTimes(1)
  })
})
