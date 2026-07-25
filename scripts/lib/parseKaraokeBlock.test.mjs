import { describe, it, expect } from 'vitest'
import { parseKaraokeBlock } from './parseKaraokeBlock.mjs'

describe('parseKaraokeBlock', () => {
  it('parses standard 2-digit-fraction timestamps', () => {
    const block = '[00:07.66] Ты нанесёшь семнадцать\n[00:13.00] Прямо на пол'
    expect(parseKaraokeBlock(block)).toEqual([
      { time: 7.66, text: 'Ты нанесёшь семнадцать' },
      { time: 13, text: 'Прямо на пол' },
    ])
  })

  it('converts minutes correctly', () => {
    const block = '[01:30.00] строка'
    expect(parseKaraokeBlock(block)).toEqual([{ time: 90, text: 'строка' }])
  })

  it('tolerates the 3-digit fraction quirk seen in real data', () => {
    const block = '[00:10.100] Снимай колготки'
    expect(parseKaraokeBlock(block)).toEqual([{ time: 10.1, text: 'Снимай колготки' }])
  })

  it('keeps trailing empty-text marker lines', () => {
    const block = '[00:05.00] строка\n[02:12.71] '
    expect(parseKaraokeBlock(block)).toEqual([
      { time: 5, text: 'строка' },
      { time: 132.71, text: '' },
    ])
  })

  it('drops a trailing empty marker whose timestamp regresses before the previous line', () => {
    const block = '[00:05.00] строка\n[00:20.00] другая строка\n[00:10.00] '
    expect(parseKaraokeBlock(block)).toEqual([
      { time: 5, text: 'строка' },
      { time: 20, text: 'другая строка' },
    ])
  })
})
