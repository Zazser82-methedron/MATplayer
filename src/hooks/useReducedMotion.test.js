import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useReducedMotion } from './useReducedMotion.js'

describe('useReducedMotion', () => {
  it('reflects the initial media query state', () => {
    window.matchMedia = (query) => ({
      matches: true,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(true)
  })

  it('updates when the media query change event fires', () => {
    let capturedListener
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      addEventListener: (_, cb) => {
        capturedListener = cb
      },
      removeEventListener: () => {},
    })
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
    act(() => {
      capturedListener({ matches: true })
    })
    expect(result.current).toBe(true)
  })
})
