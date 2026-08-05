// Единый набор SVG-иконок вместо юникод-глифов (⏮ ❚❚ ▶ ⏭ ★ ☆ ⋯ 🔇 🔊 ✕),
// которые по-разному рендерятся на разных ОС/браузерах — разной толщины, с
// несовпадающим оптическим центром. viewBox 20x20, stroke=currentColor —
// цвет наследуется от кнопки-родителя, поддержку themeing строить не нужно.
const STROKE_PROPS = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function IconPlay(props) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path d="M6 4.5v11l9-5.5-9-5.5z" fill="currentColor" />
    </svg>
  )
}

export function IconPause(props) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path d="M6 4h3v12H6V4zm5 0h3v12h-3V4z" fill="currentColor" />
    </svg>
  )
}

export function IconPrev(props) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path d="M5 4h1.5v12H5V4zm11 .3v11.4L7.8 10 16 4.3z" fill="currentColor" />
    </svg>
  )
}

export function IconNext(props) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path d="M13.5 4H15v12h-1.5V4zM4 4.3L12.2 10 4 15.7V4.3z" fill="currentColor" />
    </svg>
  )
}

export function IconStar({ filled = false, ...props }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path
        d="M10 2.5l2.35 4.76 5.25.76-3.8 3.7.9 5.23L10 14.5l-4.7 2.45.9-5.23-3.8-3.7 5.25-.76L10 2.5z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconMore(props) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <circle cx="4" cy="10" r="1.5" fill="currentColor" />
      <circle cx="10" cy="10" r="1.5" fill="currentColor" />
      <circle cx="16" cy="10" r="1.5" fill="currentColor" />
    </svg>
  )
}

export function IconClose(props) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path d="M5 5l10 10M15 5L5 15" {...STROKE_PROPS} fill="none" />
    </svg>
  )
}

export function IconMute(props) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path d="M3 8v4h3l4 3.5V4.5L6 8H3z" fill="currentColor" />
      <path d="M13 7.5l4 5M17 7.5l-4 5" {...STROKE_PROPS} fill="none" />
    </svg>
  )
}

export function IconVolume(props) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path d="M3 8v4h3l4 3.5V4.5L6 8H3z" fill="currentColor" />
      <path d="M13.5 7.2a4 4 0 010 5.6M16 5a7.5 7.5 0 010 10" {...STROKE_PROPS} fill="none" />
    </svg>
  )
}

export function IconShuffle(props) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path d="M2.5 5.5h2.8L15 15h2.5M11.5 5.5H17M2.5 14.5h2.8l2-2.4" {...STROKE_PROPS} fill="none" />
      <path d="M14.3 3.3L17.3 5.5l-3 2.2M14.3 12.3l3 2.2-3 2.2" {...STROKE_PROPS} fill="none" />
    </svg>
  )
}

export function IconRepeat({ mode = 'off', ...props }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path d="M5 6h8a3 3 0 013 3v1M15 14H7a3 3 0 01-3-3v-1" {...STROKE_PROPS} fill="none" />
      <path d="M13 3.5L15.5 6 13 8.5" {...STROKE_PROPS} fill="none" />
      <path d="M7 11.5L4.5 14 7 16.5" {...STROKE_PROPS} fill="none" />
      {mode === 'one' && (
        <text x="10" y="11.5" fontSize="7" textAnchor="middle" fill="currentColor" stroke="none">
          1
        </text>
      )}
    </svg>
  )
}

export function IconQueue(props) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path d="M4 5h9M4 10h9M4 15h5" {...STROKE_PROPS} fill="none" />
      <path d="M15 8l2 2-2 2" {...STROKE_PROPS} fill="none" />
    </svg>
  )
}

export function IconLink(props) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path d="M8.5 11.5a3 3 0 004.24 0l2-2a3 3 0 00-4.24-4.24l-1 1" {...STROKE_PROPS} fill="none" />
      <path d="M11.5 8.5a3 3 0 00-4.24 0l-2 2a3 3 0 004.24 4.24l1-1" {...STROKE_PROPS} fill="none" />
    </svg>
  )
}
