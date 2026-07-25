import { describe, it, expect } from 'vitest'
import { computeCrossfadeGains } from './crossfade.js'

describe('computeCrossfadeGains', () => {
  it('is fully outgoing at progress=0', () => {
    expect(computeCrossfadeGains(0)).toEqual({ outgoingGain: 1, incomingGain: 0 })
  })

  it('is fully incoming at progress=1', () => {
    expect(computeCrossfadeGains(1)).toEqual({ outgoingGain: 0, incomingGain: 1 })
  })

  it('is even at the midpoint', () => {
    expect(computeCrossfadeGains(0.5)).toEqual({ outgoingGain: 0.5, incomingGain: 0.5 })
  })

  it('clamps progress below 0', () => {
    expect(computeCrossfadeGains(-0.3)).toEqual({ outgoingGain: 1, incomingGain: 0 })
  })

  it('clamps progress above 1', () => {
    expect(computeCrossfadeGains(1.3)).toEqual({ outgoingGain: 0, incomingGain: 1 })
  })
})
