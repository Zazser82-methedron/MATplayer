import { usePlayerStore } from '../store/usePlayerStore.js'
import { getCurrentLineIndex } from '../lib/lyrics/lyricsSync.js'

export function LyricsOverlay({ lines, reducedMotion, textColor = '#ffffff' }) {
  const lineIndex = usePlayerStore((state) => getCurrentLineIndex(lines, state.currentTime))
  const currentText = lineIndex >= 0 ? lines[lineIndex].text : ''

  return (
    <>
      {/* Между строками текста нет — подложку в этот момент тоже не рисуем,
          иначе пустая матовая плашка висит на экране сама по себе. */}
      <div
        className={currentText ? 'lyrics-overlay lyrics-overlay--visible' : 'lyrics-overlay'}
        style={{ transition: reducedMotion ? 'none' : 'opacity 0.4s ease', color: textColor }}
      >
        {currentText}
      </div>
      <div className="sr-only" aria-live="polite">
        {currentText}
      </div>
    </>
  )
}
