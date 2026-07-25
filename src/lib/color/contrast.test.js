import { describe, it, expect } from 'vitest'
import { relativeLuminance, contrastRatio, pickReadableTextColor } from './contrast.js'

describe('relativeLuminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5)
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5)
  })
})

describe('contrastRatio', () => {
  it('is 21 for black on white (the maximum)', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1)
  })

  it('is 1 for a colour against itself', () => {
    expect(contrastRatio('#ff0055', '#ff0055')).toBeCloseTo(1, 5)
  })

  it('is symmetric regardless of argument order', () => {
    expect(contrastRatio('#0d0101', '#ffffff')).toBeCloseTo(contrastRatio('#ffffff', '#0d0101'), 5)
  })
})

describe('pickReadableTextColor', () => {
  it('picks white text on a dark background', () => {
    expect(pickReadableTextColor('#0d0101')).toBe('#ffffff')
  })

  it('picks near-black text on a light background', () => {
    expect(pickReadableTextColor('#f2ede6')).toBe('#0a0a0a')
  })

  it('meets WCAG AA on every palette background actually shipped', () => {
    for (const bg of ['#0d0101', '#1a0f14', '#050505', '#0f1420']) {
      expect(contrastRatio(pickReadableTextColor(bg), bg)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('always picks the better of the two options, even where neither reaches AA', () => {
    // Средне-серые фоны недостижимы для AA обоими вариантами: на #777777
    // белый даёт 4.478, тёмный — 4.421. Функция обязана выбрать больший из
    // двух, но обещать проход порога здесь нельзя — и она этого не обещает.
    const picked = pickReadableTextColor('#777777')
    const rejected = picked === '#ffffff' ? '#0a0a0a' : '#ffffff'
    expect(contrastRatio(picked, '#777777')).toBeGreaterThan(contrastRatio(rejected, '#777777'))
    expect(contrastRatio(picked, '#777777')).toBeLessThan(4.5)
  })
})
