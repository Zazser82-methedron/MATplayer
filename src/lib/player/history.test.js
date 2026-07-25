import { describe, it, expect } from 'vitest'
import { pushHistoryEntry, toggleFavorite, HISTORY_LIMIT } from './history.js'

describe('pushHistoryEntry', () => {
  it('puts the newest entry first', () => {
    expect(pushHistoryEntry(['b'], 'a')).toEqual(['a', 'b'])
  })

  it('moves a repeated track to the front instead of duplicating it', () => {
    expect(pushHistoryEntry(['a', 'b', 'c'], 'c')).toEqual(['c', 'a', 'b'])
  })

  it('caps the history length', () => {
    const long = Array.from({ length: HISTORY_LIMIT }, (_, i) => `t${i}`)
    const result = pushHistoryEntry(long, 'new')
    expect(result).toHaveLength(HISTORY_LIMIT)
    expect(result[0]).toBe('new')
  })

  it('does not mutate the input array', () => {
    const input = ['a']
    pushHistoryEntry(input, 'b')
    expect(input).toEqual(['a'])
  })
})

describe('toggleFavorite', () => {
  it('adds a track that is not yet favorited', () => {
    expect(toggleFavorite([], 'a')).toEqual(['a'])
  })

  it('removes a track that is already favorited', () => {
    expect(toggleFavorite(['a', 'b'], 'a')).toEqual(['b'])
  })

  it('does not mutate the input array', () => {
    const input = ['a']
    toggleFavorite(input, 'b')
    expect(input).toEqual(['a'])
  })
})
