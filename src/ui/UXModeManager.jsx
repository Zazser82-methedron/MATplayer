import { useEffect, useRef } from 'react'
import { usePlayerStore } from '../store/usePlayerStore.js'
import { computeUxMode } from './uxModeMachine.js'

const POLL_INTERVAL_MS = 250
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'touchstart', 'keydown', 'wheel', 'pointerdown']

export function UXModeManager() {
  const lastActivityRef = useRef(performance.now())

  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = performance.now()
    }
    ACTIVITY_EVENTS.forEach((eventName) => window.addEventListener(eventName, handleActivity))

    const intervalId = setInterval(() => {
      const store = usePlayerStore.getState()
      const idleSeconds = (performance.now() - lastActivityRef.current) / 1000
      const nextMode = computeUxMode(idleSeconds, { isPlaying: store.isPlaying })
      if (store.uxMode !== nextMode) {
        store.setUxMode(nextMode)
      }
      // Курсор прячется вместе с интерфейсом — иначе поверх «чистой» сцены
      // остаётся висеть стрелка, и режим погружения ломается ей одной.
      document.documentElement.dataset.matplayerUx = nextMode
    }, POLL_INTERVAL_MS)

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, handleActivity))
      clearInterval(intervalId)
    }
  }, [])

  return null
}
