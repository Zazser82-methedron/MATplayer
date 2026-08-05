import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { UXModeManager } from './UXModeManager.jsx'
import { usePlayerStore } from '../store/usePlayerStore.js'

describe('UXModeManager', () => {
  beforeEach(() => {
    // Затухание интерфейса включается только поверх играющей музыки, поэтому
    // сценарии бездействия ставят isPlaying явно.
    usePlayerStore.setState({ uxMode: 'focus', isPlaying: true })
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance'] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('switches to utility mode immediately on mouse activity', () => {
    render(<UXModeManager />)
    window.dispatchEvent(new Event('mousemove'))
    vi.advanceTimersByTime(250)
    expect(usePlayerStore.getState().uxMode).toBe('utility')
  })

  it('falls back to focus mode a few seconds after activity stops', () => {
    render(<UXModeManager />)
    window.dispatchEvent(new Event('mousemove'))
    vi.advanceTimersByTime(250)
    vi.advanceTimersByTime(8500)
    expect(usePlayerStore.getState().uxMode).toBe('focus')
  })

  it('transitions to ambient mode after prolonged inactivity', () => {
    render(<UXModeManager />)
    window.dispatchEvent(new Event('mousemove'))
    vi.advanceTimersByTime(20250)
    expect(usePlayerStore.getState().uxMode).toBe('ambient')
  })

  it('keeps the interface up indefinitely while playback is stopped', () => {
    usePlayerStore.setState({ isPlaying: false })
    render(<UXModeManager />)
    vi.advanceTimersByTime(60000)
    expect(usePlayerStore.getState().uxMode).toBe('utility')
  })

  it('hides the cursor together with the interface', () => {
    render(<UXModeManager />)
    window.dispatchEvent(new Event('mousemove'))
    vi.advanceTimersByTime(20250)
    expect(document.documentElement.dataset.matplayerUx).toBe('ambient')
    window.dispatchEvent(new Event('mousemove'))
    vi.advanceTimersByTime(250)
    expect(document.documentElement.dataset.matplayerUx).toBe('utility')
  })
})
