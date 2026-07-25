import { describe, it, expect } from 'vitest'
import { cubicBezierPoint, easeInOutCubic, computeCameraFlightPosition } from './cameraFlight.js'

describe('cubicBezierPoint', () => {
  const p0 = { x: 0, y: 0, z: 0 }
  const p1 = { x: 0, y: 5, z: 0 }
  const p2 = { x: 10, y: 5, z: 0 }
  const p3 = { x: 10, y: 0, z: 0 }

  it('is at p0 when t=0', () => {
    expect(cubicBezierPoint(0, p0, p1, p2, p3)).toEqual(p0)
  })

  it('is at p3 when t=1', () => {
    const result = cubicBezierPoint(1, p0, p1, p2, p3)
    expect(result.x).toBeCloseTo(p3.x, 5)
    expect(result.y).toBeCloseTo(p3.y, 5)
  })

  it('arcs above the endpoints at t=0.5', () => {
    const mid = cubicBezierPoint(0.5, p0, p1, p2, p3)
    expect(mid.y).toBeGreaterThan(0)
  })
})

describe('easeInOutCubic', () => {
  it('maps 0 to 0 and 1 to 1', () => {
    expect(easeInOutCubic(0)).toBe(0)
    expect(easeInOutCubic(1)).toBeCloseTo(1, 10)
  })

  it('is exactly 0.5 at the midpoint', () => {
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 10)
  })
})

describe('computeCameraFlightPosition', () => {
  const start = { x: 0, y: 0, z: 0 }
  const end = { x: 20, y: 0, z: -10 }

  it('is at the start position when elapsed=0', () => {
    const pos = computeCameraFlightPosition(0, 4, start, end)
    expect(pos.x).toBeCloseTo(start.x, 5)
    expect(pos.z).toBeCloseTo(start.z, 5)
  })

  it('is at the end position once elapsed reaches the duration', () => {
    const pos = computeCameraFlightPosition(4, 4, start, end)
    expect(pos.x).toBeCloseTo(end.x, 5)
    expect(pos.z).toBeCloseTo(end.z, 5)
  })

  it('clamps to the end position past the duration', () => {
    const pos = computeCameraFlightPosition(999, 4, start, end)
    expect(pos.x).toBeCloseTo(end.x, 5)
  })

  it('arcs above both endpoints partway through the flight', () => {
    const pos = computeCameraFlightPosition(2, 4, start, end)
    expect(pos.y).toBeGreaterThan(0)
  })
})
