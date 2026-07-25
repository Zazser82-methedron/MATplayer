import { useEffect, useRef } from 'react'
import { usePlayerStore } from '../store/usePlayerStore.js'
import { computeUxMode } from './uxModeMachine.js'

const POLL_INTERVAL_MS = 250
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'touchstart', 'keydown']

export function UXModeManager() {
  const lastActivityRef = useRef(performance.now())

  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = performance.now()
    }
    ACTIVITY_EVENTS.forEach((eventName) => window.addEventListener(eventName, handleActivity))

    const intervalId = setInterval(() => {
      const idleSeconds = (performance.now() - lastActivityRef.current) / 1000
      const nextMode = computeUxMode(idleSeconds)
      if (usePlayerStore.getState().uxMode !== nextMode) {
        usePlayerStore.getState().setUxMode(nextMode)
      }
    }, POLL_INTERVAL_MS)

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, handleActivity))
      clearInterval(intervalId)
    }
  }, [])

  return null
}
