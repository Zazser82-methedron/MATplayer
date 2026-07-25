import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { UXModeManager } from './UXModeManager.jsx'
import { usePlayerStore } from '../store/usePlayerStore.js'

describe('UXModeManager', () => {
  beforeEach(() => {
    usePlayerStore.setState({ uxMode: 'focus' })
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
    vi.advanceTimersByTime(3500)
    expect(usePlayerStore.getState().uxMode).toBe('focus')
  })

  it('transitions to ambient mode after 10s of inactivity', () => {
    render(<UXModeManager />)
    window.dispatchEvent(new Event('mousemove'))
    vi.advanceTimersByTime(10250)
    expect(usePlayerStore.getState().uxMode).toBe('ambient')
  })
})
