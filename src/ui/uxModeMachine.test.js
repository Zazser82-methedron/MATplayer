import { describe, it, expect } from 'vitest'
import { computeUxMode, UTILITY_HOLD_SECONDS, AMBIENT_THRESHOLD_SECONDS } from './uxModeMachine.js'

const PLAYING = { isPlaying: true }

describe('computeUxMode', () => {
  it('is utility immediately after activity', () => {
    expect(computeUxMode(0, PLAYING)).toBe('utility')
  })

  it('stays utility just under the hold threshold', () => {
    expect(computeUxMode(UTILITY_HOLD_SECONDS - 0.1, PLAYING)).toBe('utility')
  })

  it('becomes focus once past the utility hold', () => {
    expect(computeUxMode(UTILITY_HOLD_SECONDS, PLAYING)).toBe('focus')
  })

  it('stays focus just under the ambient threshold', () => {
    expect(computeUxMode(AMBIENT_THRESHOLD_SECONDS - 0.1, PLAYING)).toBe('focus')
  })

  it('becomes ambient at and past the ambient threshold', () => {
    expect(computeUxMode(AMBIENT_THRESHOLD_SECONDS, PLAYING)).toBe('ambient')
    expect(computeUxMode(999, PLAYING)).toBe('ambient')
  })

  // Главный дефект первого экрана: интерфейс уезжал по таймеру бездействия
  // даже когда ничего не играло. Пользователь открывал сайт, три секунды не
  // трогал мышь — и оставался с одной 3D-сценой без единой кнопки, без
  // названия трека и без способа что-либо включить. Скрывать элементы
  // управления имеет смысл только поверх идущей музыки.
  it('never hides the interface while playback is stopped', () => {
    expect(computeUxMode(999, { isPlaying: false })).toBe('utility')
    expect(computeUxMode(999)).toBe('utility')
  })

  it('holds the controls long enough to actually be used', () => {
    // Прошлые пороги (3 с до скрытия) не давали дочитать даже название трека.
    expect(UTILITY_HOLD_SECONDS).toBeGreaterThanOrEqual(6)
    expect(AMBIENT_THRESHOLD_SECONDS).toBeGreaterThan(UTILITY_HOLD_SECONDS)
  })
})
