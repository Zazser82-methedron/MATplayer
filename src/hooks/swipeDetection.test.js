import { describe, it, expect } from 'vitest'
import { classifySwipe, isDoubleTap } from './swipeDetection.js'

describe('classifySwipe', () => {
  it('classifies a small movement as a tap', () => {
    expect(classifySwipe(0, 0, 5, 5)).toBe('tap')
  })
  it('classifies a rightward swipe', () => {
    expect(classifySwipe(0, 0, 100, 0)).toBe('right')
  })
  it('classifies a leftward swipe', () => {
    expect(classifySwipe(100, 0, 0, 0)).toBe('left')
  })
  it('classifies an upward swipe', () => {
    expect(classifySwipe(0, 100, 0, 0)).toBe('up')
  })
  it('classifies a downward swipe', () => {
    expect(classifySwipe(0, 0, 0, 100)).toBe('down')
  })
  it('returns null for an ambiguous movement below the swipe threshold', () => {
    expect(classifySwipe(0, 0, 30, 30)).toBeNull()
  })
})

describe('isDoubleTap', () => {
  it('is false when there was no previous tap', () => {
    expect(isDoubleTap(null, 1000)).toBe(false)
  })
  it('is true within the double-tap window', () => {
    expect(isDoubleTap(1000, 1200)).toBe(true)
  })
  it('is false outside the double-tap window', () => {
    expect(isDoubleTap(1000, 1500)).toBe(false)
  })
})
