import { describe, it, expect, vi } from 'vitest'
import { createDedupedStorage } from './usePlayerStore.js'

describe('createDedupedStorage', () => {
  function makeBacking() {
    const data = new Map()
    return {
      setItem: vi.fn((k, v) => data.set(k, v)),
      getItem: vi.fn((k) => (data.has(k) ? data.get(k) : null)),
      removeItem: vi.fn((k) => data.delete(k)),
    }
  }

  it('writes the first value through', () => {
    const backing = makeBacking()
    const storage = createDedupedStorage(backing)
    storage.setItem('k', { state: { favorites: [] } })
    expect(backing.setItem).toHaveBeenCalledTimes(1)
  })

  it('skips repeated writes of an identical payload', () => {
    const backing = makeBacking()
    const storage = createDedupedStorage(backing)
    // Это ровно тот случай, что возникает 120 раз в секунду: стор дёргает
    // setItem на каждый set(), но сохраняемая часть состояния не менялась.
    for (let i = 0; i < 120; i++) {
      storage.setItem('k', { state: { favorites: [], history: [], repeatMode: 'off' } })
    }
    expect(backing.setItem).toHaveBeenCalledTimes(1)
  })

  it('writes again as soon as the payload really changes', () => {
    const backing = makeBacking()
    const storage = createDedupedStorage(backing)
    storage.setItem('k', { state: { favorites: [] } })
    storage.setItem('k', { state: { favorites: ['t1'] } })
    storage.setItem('k', { state: { favorites: ['t1'] } })
    expect(backing.setItem).toHaveBeenCalledTimes(2)
  })

  it('round-trips a value through getItem', () => {
    const backing = makeBacking()
    const storage = createDedupedStorage(backing)
    storage.setItem('k', { state: { repeatMode: 'all' }, version: 0 })
    expect(storage.getItem('k')).toEqual({ state: { repeatMode: 'all' }, version: 0 })
  })

  it('returns null for a missing key', () => {
    expect(createDedupedStorage(makeBacking()).getItem('nope')).toBeNull()
  })

  it('allows an identical payload to be rewritten after removal', () => {
    const backing = makeBacking()
    const storage = createDedupedStorage(backing)
    storage.setItem('k', { state: { favorites: [] } })
    storage.removeItem('k')
    storage.setItem('k', { state: { favorites: [] } })
    expect(backing.setItem).toHaveBeenCalledTimes(2)
  })
})
