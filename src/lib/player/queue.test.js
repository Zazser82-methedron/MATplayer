import { describe, it, expect } from 'vitest'
import { REPEAT_MODES, nextRepeatMode, computeNextIndex, buildShuffledOrder } from './queue.js'

describe('nextRepeatMode', () => {
  it('cycles off -> all -> one -> off', () => {
    expect(nextRepeatMode('off')).toBe('all')
    expect(nextRepeatMode('all')).toBe('one')
    expect(nextRepeatMode('one')).toBe('off')
  })

  it('only ever returns a known mode', () => {
    expect(REPEAT_MODES).toContain(nextRepeatMode('one'))
  })
})

describe('computeNextIndex', () => {
  it('advances by one in the middle of the queue', () => {
    expect(computeNextIndex(1, 4, 'off', 1)).toBe(2)
  })

  it('stops at the end when repeat is off', () => {
    expect(computeNextIndex(3, 4, 'off', 1)).toBeNull()
  })

  it('wraps to the start when repeat is all', () => {
    expect(computeNextIndex(3, 4, 'all', 1)).toBe(0)
  })

  it('stays on the same track when repeat is one', () => {
    expect(computeNextIndex(2, 4, 'one', 1)).toBe(2)
  })

  it('wraps backwards from the first track when repeat is all', () => {
    expect(computeNextIndex(0, 4, 'all', -1)).toBe(3)
  })

  it('stops before the start when going back with repeat off', () => {
    expect(computeNextIndex(0, 4, 'off', -1)).toBeNull()
  })

  it('returns null for an empty queue', () => {
    expect(computeNextIndex(0, 0, 'all', 1)).toBeNull()
  })
})

describe('repeat semantics that callers depend on', () => {
  it('returns the SAME index for repeat one — callers must not treat this as a track change', () => {
    // Ключевой контракт: setTrack с тем же id не перезапустит воспроизведение,
    // потому что зависимости эффекта загрузки не изменятся. Вызывающий код
    // обязан отличать «тот же трек» от «следующий трек» и перематывать вручную.
    expect(computeNextIndex(2, 4, 'one', 1)).toBe(2)
    expect(computeNextIndex(2, 4, 'one', -1)).toBe(2)
  })

  it('also returns the same index for repeat all on a single-track queue', () => {
    // Тот же капкан с другой стороны: у артиста с одним треком repeat: all
    // тоже возвращает текущий индекс.
    expect(computeNextIndex(0, 1, 'all', 1)).toBe(0)
  })
})

describe('buildShuffledOrder', () => {
  it('is a permutation of all indices', () => {
    const order = buildShuffledOrder(5, () => 0.5)
    expect([...order].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4])
  })

  it('puts the requested track first so shuffling does not interrupt playback', () => {
    const order = buildShuffledOrder(5, () => 0.5, 3)
    expect(order[0]).toBe(3)
  })

  it('still yields a full permutation when a first track is pinned', () => {
    const order = buildShuffledOrder(6, () => 0.31, 4)
    expect([...order].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('returns an empty array for an empty queue', () => {
    expect(buildShuffledOrder(0, () => 0.5)).toEqual([])
  })
})
