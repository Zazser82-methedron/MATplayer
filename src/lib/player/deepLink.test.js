import { describe, it, expect } from 'vitest'
import { parseDeepLink, buildDeepLinkSearch } from './deepLink.js'

describe('parseDeepLink', () => {
  it('reads artist, track and time', () => {
    expect(parseDeepLink('?artist=cupsize&track=cupsize_zppp&t=42')).toEqual({
      artistId: 'cupsize',
      trackId: 'cupsize_zppp',
      startTime: 42,
    })
  })

  it('returns nulls for an empty query string', () => {
    expect(parseDeepLink('')).toEqual({ artistId: null, trackId: null, startTime: null })
  })

  it('ignores a non-numeric time', () => {
    expect(parseDeepLink('?t=abc').startTime).toBeNull()
  })

  it('ignores a negative time', () => {
    expect(parseDeepLink('?t=-5').startTime).toBeNull()
  })

  it('accepts fractional seconds', () => {
    expect(parseDeepLink('?t=12.5').startTime).toBe(12.5)
  })

  it('ignores unrelated query params such as a cache-buster', () => {
    expect(parseDeepLink('?v=phase2&artist=cupsize')).toMatchObject({ artistId: 'cupsize', trackId: null })
  })
})

describe('buildDeepLinkSearch', () => {
  it('round-trips through parseDeepLink', () => {
    const search = buildDeepLinkSearch('cupsize', 'cupsize_zppp', 42.5)
    expect(parseDeepLink(search)).toEqual({
      artistId: 'cupsize',
      trackId: 'cupsize_zppp',
      startTime: 42.5,
    })
  })

  it('rounds the timestamp to one decimal to keep links short', () => {
    expect(buildDeepLinkSearch('a', 'b', 42.5678)).toContain('t=42.6')
  })

  it('omits the time when it is zero', () => {
    // Проверяем по смыслу, а не подстрокой: "t=" встречается внутри "artist=".
    expect(parseDeepLink(buildDeepLinkSearch('a', 'b', 0)).startTime).toBeNull()
    expect(new URLSearchParams(buildDeepLinkSearch('a', 'b', 0)).has('t')).toBe(false)
  })
})
