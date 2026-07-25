import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LyricsOverlay } from './LyricsOverlay.jsx'
import { usePlayerStore } from '../store/usePlayerStore.js'

const lines = [
  { time: 0, text: 'line one' },
  { time: 5, text: 'line two' },
]

describe('LyricsOverlay', () => {
  beforeEach(() => {
    usePlayerStore.setState({ currentTime: 0 })
  })

  it('shows the line active at the current store time', () => {
    usePlayerStore.setState({ currentTime: 6 })
    render(<LyricsOverlay lines={lines} reducedMotion={false} />)
    expect(screen.getAllByText('line two').length).toBeGreaterThan(0)
  })

  it('shows nothing before the first line starts', () => {
    usePlayerStore.setState({ currentTime: -1 })
    render(<LyricsOverlay lines={lines} reducedMotion={false} />)
    expect(screen.queryByText('line one')).toBeNull()
    expect(screen.queryByText('line two')).toBeNull()
  })
})
