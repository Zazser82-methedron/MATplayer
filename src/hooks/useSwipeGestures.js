import { useEffect, useRef } from 'react'
import { classifySwipe, isDoubleTap } from './swipeDetection.js'

export function useSwipeGestures({ onSwipeLeft, onSwipeRight, onSwipeUp, onDoubleTap }) {
  const touchStartRef = useRef(null)
  const lastTapTimeRef = useRef(null)

  useEffect(() => {
    function handleTouchStart(event) {
      const touch = event.touches[0]
      touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    }

    function handleTouchEnd(event) {
      const start = touchStartRef.current
      if (!start) return
      const touch = event.changedTouches[0]
      const direction = classifySwipe(start.x, start.y, touch.clientX, touch.clientY)
      const now = performance.now()

      if (direction === 'left') onSwipeLeft?.()
      else if (direction === 'right') onSwipeRight?.()
      else if (direction === 'up') onSwipeUp?.()
      else if (direction === 'tap') {
        if (isDoubleTap(lastTapTimeRef.current, now)) onDoubleTap?.()
        lastTapTimeRef.current = now
      }

      touchStartRef.current = null
    }

    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchend', handleTouchEnd)
    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onDoubleTap])
}
