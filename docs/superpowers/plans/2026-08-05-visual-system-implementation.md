# Visual System (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace MATplayer's ad-hoc, drifted CSS values (mismatched opacities, spacing, radii) and inconsistent unicode-glyph buttons with a small token system and a real SVG icon set, and merge the two stacked floating bars (`SeekBar` + `PlayerControls`) into one panel, matching how Spotify/Apple Music structure their now-playing bar.

**Architecture:** A `:root` token block in `src/index.css` (typography/color/spacing/radius/blur scales) that every existing surface (`player-bar`, `library-panel`, `artist-card`, `queue-panel`, `lyrics-overlay`) is migrated onto. A new `src/ui/icons.jsx` module of small inline SVG components replaces every unicode glyph button. `SeekBar` stops being its own floating panel and becomes the first child inside `PlayerControls`' `.player-bar`.

**Tech Stack:** React 18, Vite 5 (`?raw` CSS import for the token regression test), Vitest + Testing Library.

Full design rationale: `docs/superpowers/specs/2026-08-05-visual-system-design.md`.

---

### Task 1: Design tokens

**Files:**
- Modify: `src/index.css:1` (new `:root` token block) and the `.lyrics-overlay` rule (~line 32)
- Create: `src/designTokens.test.js`

- [ ] **Step 1: Write the failing regression test**

Create `src/designTokens.test.js`:

```js
import { describe, it, expect } from 'vitest'
import css from './index.css?raw'

// Каждый компонент библиотеки/плеера будет ссылаться на эти токены вместо
// произвольных чисел. Тест — страховка от того, что кто-то в будущем удалит
// токен, не заметив, что на него всё ещё опирается CSS.
const REQUIRED_TOKENS = [
  '--font-display',
  '--text-2xl',
  '--text-lg',
  '--text-md',
  '--text-sm',
  '--text-xs',
  '--ink',
  '--ink-muted',
  '--ink-faint',
  '--surface',
  '--surface-solid',
  '--border',
  '--border-strong',
  '--hover-overlay',
  '--space-1',
  '--space-2',
  '--space-3',
  '--space-4',
  '--space-6',
  '--space-8',
  '--radius-sm',
  '--radius-md',
  '--radius-lg',
  '--radius-pill',
  '--blur-panel',
  '--blur-modal',
]

describe('design tokens', () => {
  it('defines every token the visual system relies on', () => {
    for (const token of REQUIRED_TOKENS) {
      expect(css, `missing ${token}`).toMatch(new RegExp(`${token}\\s*:`))
    }
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run src/designTokens.test.js`
Expected: FAIL — none of the tokens exist yet.

- [ ] **Step 3: Add the token block to the top of `src/index.css`**

The file currently starts with:

```css
:root,
html,
body,
#root {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}
```

Insert a new `:root` block **before** that rule (a second `:root` selector is
valid CSS — the properties merge):

```css
:root {
  /* Типографика — единая шкала вместо разрозненных rem по всем файлам.
     Использование: font: var(--text-lg); (шорткод CSS font принимает
     "weight size/line-height family" одной строкой). Letter-spacing и
     text-transform для --text-xs добавляются на месте применения — в
     font-шорткод они не входят. */
  --font-display: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --text-2xl: 700 1.75rem/1.15 var(--font-display);
  --text-lg: 600 1.05rem/1.3 var(--font-display);
  --text-md: 500 0.9rem/1.4 var(--font-display);
  --text-sm: 400 0.8rem/1.4 var(--font-display);
  --text-xs: 600 0.72rem/1.3 var(--font-display);

  /* Цвет — роли вместо rgba(242,237,230,N) с непоследовательным N в каждом файле. */
  --ink: #f2ede6;
  --ink-muted: rgba(242, 237, 230, 0.62);
  --ink-faint: rgba(242, 237, 230, 0.45);
  --surface: rgba(10, 10, 10, 0.6);
  --surface-solid: rgba(12, 12, 12, 0.92);
  --border: rgba(255, 255, 255, 0.12);
  --border-strong: rgba(255, 255, 255, 0.2);
  --hover-overlay: rgba(255, 255, 255, 0.1);

  /* Отступы */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  /* Радиусы — консолидация: было 10/14/16/18/20/22px вразнобой по файлам. */
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 22px;
  --radius-pill: 999px;

  /* Blur — два уровня: плавающие панели держат поменьше, модалки побольше. */
  --blur-panel: 18px;
  --blur-modal: 22px;
}

:root,
html,
body,
#root {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}
```

- [ ] **Step 4: Run the regression test again**

Run: `npx vitest run src/designTokens.test.js`
Expected: PASS

- [ ] **Step 5: Apply the tokens to `.lyrics-overlay` as a first live example**

Find (still in `src/index.css`):

```css
.lyrics-overlay {
  position: absolute;
  left: 50%;
  bottom: 14%;
  transform: translateX(-50%);
  width: min(90vw, 760px);
  text-align: center;
  font-size: clamp(1.05rem, 2.2vw, 1.75rem);
  font-weight: 600;
  line-height: 1.4;
  text-shadow:
    0 2px 14px rgba(0, 0, 0, 0.7),
    0 0 48px rgba(0, 0, 0, 0.45);
  padding: 10px 18px;
  border-radius: 14px;
  pointer-events: none;
  z-index: 5;
  min-height: 1.6em;
}
```

Replace with (only `padding`/`border-radius` change — `font-size` stays a
`clamp()` because it scales continuously with viewport width, which no
discrete token step should replace):

```css
.lyrics-overlay {
  position: absolute;
  left: 50%;
  bottom: 14%;
  transform: translateX(-50%);
  width: min(90vw, 760px);
  text-align: center;
  font-size: clamp(1.05rem, 2.2vw, 1.75rem);
  font-weight: 600;
  line-height: 1.4;
  text-shadow:
    0 2px 14px rgba(0, 0, 0, 0.7),
    0 0 48px rgba(0, 0, 0, 0.45);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  pointer-events: none;
  z-index: 5;
  min-height: 1.6em;
}
```

- [ ] **Step 6: Run the full suite to confirm nothing broke**

Run: `npx vitest run`
Expected: PASS, same test count as before this task (`LyricsOverlay.test.jsx`
asserts DOM structure, not computed CSS, so it is unaffected).

- [ ] **Step 7: Commit**

```bash
git add src/index.css src/designTokens.test.js
git commit -m "feat: add design token system to index.css"
```

---

### Task 2: Icon set

**Files:**
- Create: `src/ui/icons.jsx`
- Create: `src/ui/icons.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `src/ui/icons.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import {
  IconPlay,
  IconPause,
  IconPrev,
  IconNext,
  IconStar,
  IconMore,
  IconClose,
  IconMute,
  IconVolume,
  IconShuffle,
  IconRepeat,
  IconQueue,
  IconLink,
} from './icons.jsx'

const DECORATIVE_ICONS = {
  IconPlay,
  IconPause,
  IconPrev,
  IconNext,
  IconMore,
  IconClose,
  IconMute,
  IconVolume,
  IconShuffle,
  IconQueue,
  IconLink,
}

describe('icon set', () => {
  it('renders every icon as a decorative, self-contained SVG', () => {
    for (const [name, Icon] of Object.entries(DECORATIVE_ICONS)) {
      const { container } = render(<Icon />)
      const svg = container.querySelector('svg')
      expect(svg, `${name} should render an <svg>`).toBeTruthy()
      // aria-hidden: семантика иконки-кнопки идёт через aria-label самой
      // кнопки, а не через содержимое SVG — иначе скринридер озвучит и то,
      // и другое.
      expect(svg.getAttribute('aria-hidden')).toBe('true')
    }
  })

  it('IconStar switches between outline and filled', () => {
    const { container: outline } = render(<IconStar />)
    const { container: filled } = render(<IconStar filled />)
    expect(outline.querySelector('path').getAttribute('fill')).toBe('none')
    expect(filled.querySelector('path').getAttribute('fill')).toBe('currentColor')
  })

  it('IconRepeat draws the "1" marker only in one-track mode', () => {
    const { container: off } = render(<IconRepeat mode="off" />)
    const { container: all } = render(<IconRepeat mode="all" />)
    const { container: one } = render(<IconRepeat mode="one" />)
    expect(off.querySelector('text')).toBeNull()
    expect(all.querySelector('text')).toBeNull()
    expect(one.querySelector('text')).toBeTruthy()
    expect(one.querySelector('text').textContent).toBe('1')
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run src/ui/icons.test.jsx`
Expected: FAIL — `src/ui/icons.jsx` does not exist yet.

- [ ] **Step 3: Create `src/ui/icons.jsx`**

```jsx
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
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npx vitest run src/ui/icons.test.jsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/icons.jsx src/ui/icons.test.jsx
git commit -m "feat: add SVG icon set to replace unicode glyph buttons"
```

---

### Task 3: Rebuild PlayerControls — merged seek bar, real icons, real VolumeControl

**Files:**
- Modify: `src/ui/PlayerControls.jsx` (full rewrite)
- Modify: `src/ui/PlayerControls.test.jsx`
- Modify: `src/ui/VolumeControl.jsx`
- Modify: `src/index.css` (`.seek-bar`, `.player-bar*`, `.player-menu*`, new `.volume-control*`)

- [ ] **Step 1: Update `PlayerControls.test.jsx` first (TDD: the test describes the target shape)**

Replace the whole file with:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PlayerControls } from './PlayerControls.jsx'
import { usePlayerStore } from '../store/usePlayerStore.js'

function renderControls(overrides = {}) {
  const noop = () => {}
  return render(
    <PlayerControls
      artistName="Cupsize"
      albumTitle="ЗМП"
      trackTitle="Семнадцать ножевых"
      isPlaying={false}
      isFavorite={false}
      onTogglePlay={noop}
      onToggleFavorite={noop}
      onPrevTrack={noop}
      onNextTrack={noop}
      onNextArtist={noop}
      onOpenLibrary={noop}
      onOpenQueue={noop}
      onShare={noop}
      repeatMode="off"
      onCycleRepeat={noop}
      isShuffled={false}
      onToggleShuffle={noop}
      uiVolume={1}
      isMuted={false}
      onVolumeChange={noop}
      onToggleMute={noop}
      currentTime={30}
      duration={180}
      peaks={[]}
      onSeek={noop}
      {...overrides}
    />,
  )
}

describe('PlayerControls', () => {
  beforeEach(() => {
    usePlayerStore.setState({ uxMode: 'utility' })
  })

  it('renders nothing outside utility mode', () => {
    usePlayerStore.setState({ uxMode: 'focus' })
    renderControls()
    expect(screen.queryByRole('toolbar')).toBeNull()
  })

  it('shows track, artist and album', () => {
    renderControls()
    expect(screen.getByText('Семнадцать ножевых')).toBeInTheDocument()
    expect(screen.getByText('Cupsize · ЗМП')).toBeInTheDocument()
  })

  it('omits the album separator when there is no album', () => {
    renderControls({ albumTitle: null })
    expect(screen.getByText('Cupsize')).toBeInTheDocument()
  })

  it('keeps exactly three transport actions plus favourite and overflow visible', () => {
    renderControls()
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous track' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next track' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Favorite this track' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'More controls' })).toBeInTheDocument()
    expect(screen.queryByRole('menu')).toBeNull()
    expect(screen.queryByRole('button', { name: /Библиотека/ })).toBeNull()
  })

  it('shows the seek bar inside the same panel, not as a separate floating one', () => {
    renderControls()
    const slider = screen.getByRole('slider', { name: 'Seek' })
    expect(screen.getByRole('toolbar', { name: 'Player controls' })).toContainElement(slider)
  })

  it('reveals the secondary controls only after opening the overflow menu', () => {
    renderControls()
    fireEvent.click(screen.getByRole('button', { name: 'More controls' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Библиотека' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Очередь' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Volume' })).toBeInTheDocument()
  })

  it('reports play, track changes and favourite from the visible row', () => {
    const onTogglePlay = vi.fn()
    const onPrevTrack = vi.fn()
    const onNextTrack = vi.fn()
    const onToggleFavorite = vi.fn()
    renderControls({ onTogglePlay, onPrevTrack, onNextTrack, onToggleFavorite })

    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    fireEvent.click(screen.getByRole('button', { name: 'Previous track' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next track' }))
    fireEvent.click(screen.getByRole('button', { name: 'Favorite this track' }))

    expect(onTogglePlay).toHaveBeenCalledTimes(1)
    expect(onPrevTrack).toHaveBeenCalledTimes(1)
    expect(onNextTrack).toHaveBeenCalledTimes(1)
    expect(onToggleFavorite).toHaveBeenCalledTimes(1)
  })

  it('marks the favourite button as pressed for a favourited track', () => {
    renderControls({ isFavorite: true })
    expect(screen.getByRole('button', { name: 'Favorite this track' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('labels the play button as Pause during playback', () => {
    renderControls({ isPlaying: true })
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
  })

  it('opens the library from the menu and closes the menu afterwards', () => {
    const onOpenLibrary = vi.fn()
    renderControls({ onOpenLibrary })
    fireEvent.click(screen.getByRole('button', { name: 'More controls' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Библиотека' }))
    expect(onOpenLibrary).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('shows the current repeat mode in the menu', () => {
    renderControls({ repeatMode: 'one' })
    fireEvent.click(screen.getByRole('button', { name: 'More controls' }))
    expect(screen.getByRole('menuitem', { name: 'Повтор: один' })).toBeInTheDocument()
  })

  it('closes the menu on Escape', () => {
    renderControls()
    fireEvent.click(screen.getByRole('button', { name: 'More controls' }))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('reports seeking through the volume menu row without breaking overflow toggles', () => {
    const onVolumeChange = vi.fn()
    renderControls({ onVolumeChange })
    fireEvent.click(screen.getByRole('button', { name: 'More controls' }))
    fireEvent.change(screen.getByRole('slider', { name: 'Volume' }), { target: { value: '0.4' } })
    expect(onVolumeChange).toHaveBeenCalledWith(0.4)
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `npx vitest run src/ui/PlayerControls.test.jsx`
Expected: FAIL — `PlayerControls` doesn't accept `currentTime`/`duration`/`peaks`/`onSeek` yet, no seek slider rendered.

- [ ] **Step 3: Swap `VolumeControl.jsx`'s emoji for icons**

`src/ui/VolumeControl.jsx` currently:

```jsx
export function VolumeControl({ uiVolume, isMuted, onChange, onToggleMute }) {
  return (
    <span className="volume-control">
      <button type="button" onClick={onToggleMute} aria-pressed={isMuted} aria-label="Mute">
        {isMuted ? '🔇' : '🔊'}
      </button>
      <input
        type="range"
        className="volume-control__slider"
        min="0"
        max="1"
        step="0.01"
        value={uiVolume}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label="Volume"
      />
    </span>
  )
}
```

Replace with:

```jsx
import { IconMute, IconVolume } from './icons.jsx'

export function VolumeControl({ uiVolume, isMuted, onChange, onToggleMute }) {
  return (
    <span className="volume-control">
      <button type="button" onClick={onToggleMute} aria-pressed={isMuted} aria-label="Mute">
        {isMuted ? <IconMute /> : <IconVolume />}
      </button>
      <input
        type="range"
        className="volume-control__slider"
        min="0"
        max="1"
        step="0.01"
        value={uiVolume}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label="Volume"
      />
    </span>
  )
}
```

- [ ] **Step 4: Rewrite `PlayerControls.jsx`**

Replace the entire file with:

```jsx
import { useEffect, useRef, useState } from 'react'
import { usePlayerStore } from '../store/usePlayerStore.js'
import { SeekBar } from './SeekBar.jsx'
import { VolumeControl } from './VolumeControl.jsx'
import {
  IconPlay,
  IconPause,
  IconPrev,
  IconNext,
  IconStar,
  IconMore,
  IconShuffle,
  IconRepeat,
  IconQueue,
  IconLink,
} from './icons.jsx'

// На виду только то, что нажимают постоянно: прогресс, play, переключение
// трека и избранное. Остальное (очередь, shuffle, repeat, громкость, шеринг,
// библиотека) уходит под «…» — так устроены все крупные плееры. Шкала
// прогресса раньше была отдельной плавающей капсулой над этой панелью; ни
// один референсный плеер так не делает — теперь это первая строка той же
// панели.
export function PlayerControls({
  artistName,
  albumTitle,
  trackTitle,
  isPlaying,
  isFavorite,
  onTogglePlay,
  onToggleFavorite,
  onPrevTrack,
  onNextTrack,
  onNextArtist,
  onOpenLibrary,
  onOpenQueue,
  onShare,
  repeatMode,
  onCycleRepeat,
  isShuffled,
  onToggleShuffle,
  uiVolume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  currentTime,
  duration,
  peaks,
  onSeek,
}) {
  const uxMode = usePlayerStore((s) => s.uxMode)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!isMenuOpen) return undefined
    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsMenuOpen(false)
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }
    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen])

  if (uxMode !== 'utility') return null

  return (
    <div className="player-bar" role="toolbar" aria-label="Player controls">
      <SeekBar currentTime={currentTime} duration={duration} peaks={peaks} onSeek={onSeek} />

      <div className="player-bar__row">
        <div className="player-bar__meta">
          <span className="player-bar__track">{trackTitle}</span>
          <span className="player-bar__sub">
            {artistName}
            {albumTitle ? ` · ${albumTitle}` : ''}
          </span>
        </div>

        <div className="player-bar__transport">
          <button type="button" className="player-bar__icon" onClick={onPrevTrack} aria-label="Previous track">
            <IconPrev />
          </button>
          <button
            type="button"
            className="player-bar__play"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <IconPause /> : <IconPlay />}
          </button>
          <button type="button" className="player-bar__icon" onClick={onNextTrack} aria-label="Next track">
            <IconNext />
          </button>
        </div>

        <div className="player-bar__end" ref={menuRef}>
          <button
            type="button"
            className="player-bar__icon player-bar__fav"
            onClick={onToggleFavorite}
            aria-pressed={isFavorite}
            aria-label="Favorite this track"
          >
            <IconStar filled={isFavorite} />
          </button>
          <button
            type="button"
            className="player-bar__icon"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-label="More controls"
          >
            <IconMore />
          </button>

          {isMenuOpen && (
            <div className="player-menu" role="menu">
              <button type="button" role="menuitem" onClick={() => { onOpenLibrary(); setIsMenuOpen(false) }}>
                Библиотека
              </button>
              <button type="button" role="menuitem" onClick={() => { onOpenQueue(); setIsMenuOpen(false) }}>
                <IconQueue /> Очередь
              </button>
              <button type="button" role="menuitem" onClick={() => { onNextArtist(); setIsMenuOpen(false) }}>
                Другой исполнитель
              </button>
              <div className="player-menu__separator" />
              <button type="button" role="menuitem" onClick={onToggleShuffle} aria-pressed={isShuffled}>
                <IconShuffle /> Перемешать{isShuffled ? ' ✓' : ''}
              </button>
              <button type="button" role="menuitem" onClick={onCycleRepeat}>
                <IconRepeat mode={repeatMode} /> Повтор: {{ off: 'выкл', all: 'все', one: 'один' }[repeatMode]}
              </button>
              <div className="player-menu__separator" />
              <div className="player-menu__volume">
                <VolumeControl
                  uiVolume={uiVolume}
                  isMuted={isMuted}
                  onChange={onVolumeChange}
                  onToggleMute={onToggleMute}
                />
              </div>
              <div className="player-menu__separator" />
              <button type="button" role="menuitem" onClick={() => { onShare(); setIsMenuOpen(false) }}>
                <IconLink /> Скопировать ссылку
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Update the CSS — replace the old `.seek-bar`, `.player-bar*`, `.player-menu*` rules**

In `src/index.css`, find the `.player-bar` rule through the end of the
`.player-menu__mute` rule (roughly the block starting at the comment `/*
Нижняя панель...` and ending right before `/* Заголовок альбома в
библиотеке */`) and replace that whole block with:

```css
/* Нижняя панель: шкала прогресса — первая строка, ниже — что играет,
   транспорт, второстепенное. Раньше шкала была отдельной плавающей
   капсулой над этой панелью — двумя независимыми элементами вместо
   одного, что и давало ощущение "собрано из кусков". Транспорт
   центрируется через justify-content: space-between на трёх равных
   зонах, чтобы play стоял по центру независимо от длины названия трека. */
.player-bar {
  position: absolute;
  z-index: 10;
  left: 50%;
  bottom: var(--space-6);
  transform: translateX(-50%);
  width: min(94vw, 620px);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--surface);
  -webkit-backdrop-filter: blur(var(--blur-panel)) saturate(140%);
  backdrop-filter: blur(var(--blur-panel)) saturate(140%);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--ink);
}

.player-bar__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.player-bar__meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
  line-height: 1.3;
}

.player-bar__track {
  font: var(--text-lg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-bar__sub {
  font: var(--text-sm);
  color: var(--ink-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-bar__transport {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.player-bar__end {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex: 1;
  justify-content: flex-end;
}

.player-bar__icon {
  appearance: none;
  border: none;
  background: transparent;
  color: var(--ink-muted);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, color 0.15s ease;
}

.player-bar__icon svg {
  width: 20px;
  height: 20px;
}

.player-bar__icon:hover {
  background: var(--hover-overlay);
  color: var(--ink);
}

.player-bar__fav[aria-pressed='true'] {
  color: #ffd257;
}

/* Play — единственная акцентная кнопка: она нажимается чаще всего. */
.player-bar__play {
  appearance: none;
  border: none;
  background: var(--ink);
  color: #0a0a0a;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.12s ease;
}

.player-bar__play svg {
  width: 20px;
  height: 20px;
}

.player-bar__play:hover {
  transform: scale(1.06);
}

.player-bar__play:active {
  transform: scale(0.96);
}

.player-menu {
  position: absolute;
  right: 0;
  bottom: 46px;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  padding: var(--space-1);
  background: var(--surface-solid);
  -webkit-backdrop-filter: blur(var(--blur-modal));
  backdrop-filter: blur(var(--blur-modal));
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.55);
}

.player-menu button {
  appearance: none;
  border: none;
  background: transparent;
  color: var(--ink);
  text-align: left;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  font: var(--text-md);
  cursor: pointer;
}

.player-menu button svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.player-menu button:hover {
  background: var(--hover-overlay);
}

.player-menu__separator {
  height: 1px;
  margin: 5px var(--space-2);
  background: var(--border);
}

.player-menu__volume {
  padding: var(--space-1) var(--space-2) var(--space-2);
}

.volume-control {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
}

.volume-control button {
  appearance: none;
  border: none;
  background: transparent;
  color: var(--ink-muted);
  padding: 4px;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.volume-control button svg {
  width: 18px;
  height: 18px;
}

.volume-control__slider {
  flex: 1;
  accent-color: var(--ink);
  cursor: pointer;
}
```

Then find the standalone `.seek-bar` rule (which used to render the shka
as its own floating pill: `position: absolute; z-index: 9; left: 50%;
bottom: 92px; ...`) and replace it with the flow version — it now sits
inside `.player-bar`, which already provides the background/border/blur:

```css
.seek-bar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  font: var(--text-sm);
}
```

Leave `.seek-bar__track`, `.seek-bar__peaks`, `.seek-bar__peak`,
`.seek-bar__peak[data-played='true']`, `.seek-bar__input` exactly as they
are — they define the internal waveform/drag behaviour, not the panel
chrome, and are unaffected by where the panel is anchored.

Finally, update the mobile media query — find:

```css
@media (max-width: 520px) {
  .player-bar {
    width: calc(100vw - 20px);
    bottom: 12px;
  }
  .player-bar__meta {
    max-width: 40%;
  }
}
```

Replace `bottom: 12px;` with `bottom: var(--space-3);`.

- [ ] **Step 6: Run the test to confirm it passes**

Run: `npx vitest run src/ui/PlayerControls.test.jsx src/ui/VolumeControl.test.jsx src/ui/SeekBar.test.jsx`
Expected: PASS — `SeekBar.test.jsx` renders `SeekBar` standalone, so it is
unaffected by the CSS move; `VolumeControl.test.jsx` matches by role/label,
unaffected by the icon swap.

- [ ] **Step 7: Commit**

```bash
git add src/ui/PlayerControls.jsx src/ui/PlayerControls.test.jsx src/ui/VolumeControl.jsx src/index.css
git commit -m "refactor: merge seek bar into player bar, switch to SVG icons"
```

---

### Task 4: Update `App.jsx` to stop rendering a standalone `SeekBar`

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Remove the now-unused `SeekBar` import**

Find:

```jsx
import { SeekBar } from './ui/SeekBar.jsx'
```

Delete this line — `SeekBar` is now rendered from inside `PlayerControls.jsx`.

- [ ] **Step 2: Remove the now-unused `uxMode` read**

Find:

```jsx
  const uxMode = usePlayerStore((s) => s.uxMode)
```

Delete this line — `PlayerControls` already reads `uxMode` from the store
itself to decide whether to render at all; `App.jsx` no longer has any other
use for it (it was only read here and in the block removed in the next step).

- [ ] **Step 3: Replace the standalone `SeekBar` block and pass its props into `PlayerControls`**

Find:

```jsx
      {uxMode === 'utility' && (
        <SeekBar
          currentTime={currentSecond}
          duration={duration}
          peaks={peaks}
          onSeek={(time) => {
            if (audioRef.current) audioRef.current.currentTime = time
          }}
        />
      )}
      <PlayerControls
        artistName={activeArtist.name}
        albumTitle={ALBUM_BY_TRACK_ID[activeTrack.track_id]?.title ?? null}
        trackTitle={activeTrack.title ?? ''}
        isPlaying={isPlaying}
        isFavorite={favorites.includes(activeTrack.track_id)}
        onTogglePlay={() => {
```

Replace with:

```jsx
      <PlayerControls
        artistName={activeArtist.name}
        albumTitle={ALBUM_BY_TRACK_ID[activeTrack.track_id]?.title ?? null}
        trackTitle={activeTrack.title ?? ''}
        isPlaying={isPlaying}
        isFavorite={favorites.includes(activeTrack.track_id)}
        currentTime={currentSecond}
        duration={duration}
        peaks={peaks}
        onSeek={(time) => {
          if (audioRef.current) audioRef.current.currentTime = time
        }}
        onTogglePlay={() => {
```

(Everything after `onTogglePlay={() => {` in the `<PlayerControls>` call —
`onToggleFavorite`, `onPrevTrack`, `onNextTrack`, and the rest — stays
exactly as it was; only the new props above it are inserted and the
standalone `<SeekBar>` block above `<PlayerControls>` is removed.)

- [ ] **Step 4: Run the full suite**

Run: `npx vitest run`
Expected: PASS, same test count as after Task 3 (no test targets `App.jsx`
directly — its behaviour is covered through `PlayerControls.test.jsx` and
the live Playwright check in Task 8).

- [ ] **Step 5: Run the production build to catch any unused-import/dead-code issues**

Run: `npm run build`
Expected: Build succeeds with no new errors (the existing "chunk larger than
500 kB" warning is pre-existing and expected).

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx
git commit -m "refactor: render the seek bar from inside PlayerControls, not App"
```

---

### Task 5: Library.jsx — icons and tokens

**Files:**
- Modify: `src/ui/Library.jsx`
- Modify: `src/index.css` (`.library-panel*`)

- [ ] **Step 1: Swap the close button and favourite star for icons**

In `src/ui/Library.jsx`, find:

```jsx
import { useEffect, useState } from 'react'
import { searchLibraryEntries, formatMood, groupEntriesByAlbum } from '../lib/library/buildLibrary.js'
```

Replace with:

```jsx
import { useEffect, useState } from 'react'
import { searchLibraryEntries, formatMood, groupEntriesByAlbum } from '../lib/library/buildLibrary.js'
import { IconClose, IconStar } from './icons.jsx'
```

Find:

```jsx
        <button type="button" className="library-panel__close" onClick={onClose} aria-label="Close library">
          ✕
        </button>
```

Replace with:

```jsx
        <button type="button" className="library-panel__close" onClick={onClose} aria-label="Close library">
          <IconClose />
        </button>
```

Find:

```jsx
                    <button
                      type="button"
                      className="library-panel__fav"
                      aria-pressed={favorites.includes(entry.trackId)}
                      aria-label={`Favorite ${entry.title}`}
                      onClick={() => onToggleFavorite?.(entry.trackId)}
                    >
                      {favorites.includes(entry.trackId) ? '★' : '☆'}
                    </button>
```

Replace with:

```jsx
                    <button
                      type="button"
                      className="library-panel__fav"
                      aria-pressed={favorites.includes(entry.trackId)}
                      aria-label={`Favorite ${entry.title}`}
                      onClick={() => onToggleFavorite?.(entry.trackId)}
                    >
                      <IconStar filled={favorites.includes(entry.trackId)} />
                    </button>
```

- [ ] **Step 2: Update the CSS**

In `src/index.css`, find the block from `.library-panel {` through
`.library-panel__mood {...}` (ends right before the `@media (max-width:
520px) { .library-panel {...` block) and replace it with:

```css
.library-panel {
  position: absolute;
  z-index: 20;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(92vw, 480px);
  max-height: min(78vh, 640px);
  display: flex;
  flex-direction: column;
  background: var(--surface-solid);
  -webkit-backdrop-filter: blur(var(--blur-modal));
  backdrop-filter: blur(var(--blur-modal));
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
  color: var(--ink);
  font-family: inherit;
  overflow: hidden;
}

.library-panel__header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-4) var(--space-3);
  border-bottom: 1px solid var(--border);
}

.library-panel__search {
  flex: 1;
  appearance: none;
  border: 1px solid var(--border-strong);
  background: var(--hover-overlay);
  color: inherit;
  padding: 9px var(--space-4);
  border-radius: var(--radius-pill);
  font: var(--text-md);
}

.library-panel__search:focus {
  outline: 2px solid rgba(255, 255, 255, 0.4);
  outline-offset: 1px;
}

.library-panel__close {
  appearance: none;
  border: 1px solid var(--border-strong);
  background: var(--hover-overlay);
  color: inherit;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.library-panel__close svg {
  width: 16px;
  height: 16px;
}

.library-panel__close:hover {
  background: var(--border-strong);
}

.library-panel__list {
  list-style: none;
  margin: 0;
  padding: var(--space-2);
  overflow-y: auto;
}

.library-panel__empty {
  padding: var(--space-6) var(--space-3);
  text-align: center;
  color: var(--ink-muted);
}

.library-panel__row {
  appearance: none;
  width: 100%;
  display: grid;
  grid-template-columns: 22px 1fr auto;
  align-items: center;
  column-gap: var(--space-2);
  text-align: left;
  border: 1px solid transparent;
  background: transparent;
  color: inherit;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  font: var(--text-md);
  cursor: pointer;
  transition: background 0.15s ease;
}

.library-panel__index {
  font: var(--text-sm);
  color: var(--ink-faint);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.library-panel__row:hover {
  background: var(--hover-overlay);
}

.library-panel__row[aria-current='true'] {
  background: rgba(255, 255, 255, 0.16);
  border-color: var(--border-strong);
}

.library-panel__item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.library-panel__item .library-panel__row {
  flex: 1;
  min-width: 0;
}

.library-panel__fav {
  appearance: none;
  border: none;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.library-panel__fav svg {
  width: 18px;
  height: 18px;
}

.library-panel__fav[aria-pressed='true'] {
  color: #ffd257;
}

.library-panel__title {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.library-panel__mood {
  font: var(--text-sm);
  color: var(--ink-faint);
  white-space: nowrap;
}
```

There is a second, separate `.library-panel__album` rule further down the
file (added when album grouping shipped). Find:

```css
/* Заголовок альбома в библиотеке */
.library-panel__album {
  padding: 12px 12px 4px;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(242, 237, 230, 0.45);
}
```

Replace with:

```css
/* Заголовок альбома в библиотеке */
.library-panel__album {
  padding: var(--space-3) var(--space-3) var(--space-1);
  font: var(--text-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-faint);
}
```

- [ ] **Step 3: Run the Library tests**

Run: `npx vitest run src/ui/Library.test.jsx`
Expected: PASS — every assertion queries by role/label/text, none by glyph.

- [ ] **Step 4: Commit**

```bash
git add src/ui/Library.jsx src/index.css
git commit -m "refactor: apply design tokens and SVG icons to Library"
```

---

### Task 6: ArtistCard.jsx — icons and tokens

**Files:**
- Modify: `src/ui/ArtistCard.jsx`
- Modify: `src/index.css` (`.artist-card*`)

- [ ] **Step 1: Swap the close button for an icon**

In `src/ui/ArtistCard.jsx`, find:

```jsx
import { useEffect } from 'react'
import { formatMood } from '../lib/library/buildLibrary.js'
```

Replace with:

```jsx
import { useEffect } from 'react'
import { formatMood } from '../lib/library/buildLibrary.js'
import { IconClose } from './icons.jsx'
```

Find:

```jsx
        <button type="button" onClick={onClose} aria-label="Close artist card">
          ✕
        </button>
```

Replace with:

```jsx
        <button type="button" onClick={onClose} aria-label="Close artist card">
          <IconClose />
        </button>
```

- [ ] **Step 2: Update the CSS**

In `src/index.css`, find the block from `.artist-card {` through
`.artist-card__mood {...}` and replace it with:

```css
.artist-card {
  position: absolute;
  z-index: 22;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: min(96vw, 520px);
  max-height: 82vh;
  display: flex;
  flex-direction: column;
  padding: var(--space-4) var(--space-4) var(--space-6);
  background: var(--surface-solid);
  -webkit-backdrop-filter: blur(var(--blur-modal));
  backdrop-filter: blur(var(--blur-modal));
  border: 1px solid var(--border);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  color: var(--ink);
  overflow: hidden;
}

.artist-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.artist-card__header button {
  appearance: none;
  border: 1px solid var(--border-strong);
  background: var(--hover-overlay);
  color: inherit;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.artist-card__header button svg {
  width: 16px;
  height: 16px;
}

.artist-card__name {
  margin: 0;
  font: var(--text-2xl);
}

.artist-card__bio {
  margin: var(--space-3) 0 0;
  color: var(--ink-muted);
  line-height: 1.5;
}

.artist-card__count {
  margin: var(--space-4) 0 var(--space-2);
  font: var(--text-sm);
  color: var(--ink-faint);
}

.artist-card__list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
}

.artist-card__row {
  appearance: none;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  text-align: left;
  border: none;
  background: transparent;
  color: inherit;
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  font-family: inherit;
  cursor: pointer;
}

.artist-card__row:hover {
  background: var(--hover-overlay);
}

.artist-card__mood {
  font: var(--text-sm);
  color: var(--ink-faint);
  white-space: nowrap;
}
```

- [ ] **Step 3: Run the ArtistCard tests**

Run: `npx vitest run src/ui/ArtistCard.test.jsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/ui/ArtistCard.jsx src/index.css
git commit -m "refactor: apply design tokens and SVG icons to ArtistCard"
```

---

### Task 7: QueuePanel.jsx — icons, tokens, and a corrected vertical offset

**Files:**
- Modify: `src/ui/QueuePanel.jsx`
- Modify: `src/index.css` (`.queue-panel*`)

The merged player bar (Task 3) is taller than the two stacked panels it
replaced, so `QueuePanel`'s hardcoded `bottom: 92px` — tuned to clear the
*old* two-panel stack — now needs to clear the *new*, taller single panel
instead, or the two would visually overlap.

- [ ] **Step 1: Swap the close button for an icon**

In `src/ui/QueuePanel.jsx`, find:

```jsx
export function QueuePanel({ entries, isOpen, activeTrackId, onSelect, onClose }) {
  if (!isOpen) return null

  return (
    <div className="queue-panel" role="dialog" aria-label="Play queue">
      <div className="queue-panel__header">
        <span>Up next</span>
        <button type="button" onClick={onClose} aria-label="Close queue">
          ✕
        </button>
      </div>
```

Replace with:

```jsx
import { IconClose } from './icons.jsx'

export function QueuePanel({ entries, isOpen, activeTrackId, onSelect, onClose }) {
  if (!isOpen) return null

  return (
    <div className="queue-panel" role="dialog" aria-label="Play queue">
      <div className="queue-panel__header">
        <span>Up next</span>
        <button type="button" onClick={onClose} aria-label="Close queue">
          <IconClose />
        </button>
      </div>
```

- [ ] **Step 2: Update the CSS, including the corrected offset**

In `src/index.css`, find the block from `.queue-panel {` through
`.queue-panel__artist {...}` and replace it with:

```css
.queue-panel {
  position: absolute;
  z-index: 18;
  right: var(--space-4);
  /* Было 92px — рассчитано под старую пару плавающих панелей (seek-bar +
     player-bar). После их слияния в одну, более высокую панель (Task 3)
     это значение пересчитано, чтобы очередь не наезжала на неё. */
  bottom: 150px;
  width: min(88vw, 320px);
  max-height: 46vh;
  display: flex;
  flex-direction: column;
  background: var(--surface-solid);
  -webkit-backdrop-filter: blur(var(--blur-modal));
  backdrop-filter: blur(var(--blur-modal));
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--ink);
  overflow: hidden;
}

.queue-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  font-weight: 600;
  border-bottom: 1px solid var(--border);
}

.queue-panel__header button {
  appearance: none;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-1);
}

.queue-panel__header button svg {
  width: 16px;
  height: 16px;
}

.queue-panel__list {
  list-style: none;
  margin: 0;
  padding: var(--space-1);
  overflow-y: auto;
}

.queue-panel__row {
  appearance: none;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  text-align: left;
  border: 1px solid transparent;
  background: transparent;
  color: inherit;
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  font-family: inherit;
  cursor: pointer;
}

.queue-panel__row:hover {
  background: var(--hover-overlay);
}

.queue-panel__row[aria-current='true'] {
  background: rgba(255, 255, 255, 0.16);
  border-color: var(--border-strong);
}

.queue-panel__artist {
  font: var(--text-sm);
  color: var(--ink-muted);
}
```

- [ ] **Step 3: Run the QueuePanel tests**

Run: `npx vitest run src/ui/QueuePanel.test.jsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/ui/QueuePanel.jsx src/index.css
git commit -m "refactor: apply design tokens and SVG icons to QueuePanel, fix offset"
```

---

### Task 8: Full verification, deploy, live check

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: PASS, all tests green (298 tests plus the new `designTokens.test.js`
and `icons.test.jsx` cases added in this plan).

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: Succeeds, no new errors (the pre-existing "chunk larger than 500 kB"
warning is expected and unrelated to this work).

- [ ] **Step 3: Commit any remaining changes, then push**

```bash
git add -A
git status --short   # confirm nothing unexpected is staged
git commit -m "chore: visual system phase 1 complete" --allow-empty
git push origin master
```

- [ ] **Step 4: Wait for the GitHub Pages deploy**

```bash
gh run list --repo Zazser82-methedron/MATplayer --limit 1
```

Poll every ~10s until `status` is `completed` and `conclusion` is `success`
(the deploy workflow historically takes 30–40s).

- [ ] **Step 5: Verify live with Playwright — panel is merged, icons render, no console errors**

Navigate to `https://zazser82-methedron.github.io/MATplayer/?cb=<unique>`
(cache-busting query param — GitHub Pages caches aggressively), resize to
1440×900, take a screenshot, and confirm visually:
- One panel at the bottom (progress bar + track info + transport in the same
  card), not two stacked capsules.
- Transport/favourite/more buttons show crisp icons, not unicode glyphs.
- Open the overflow menu (`More controls`) and confirm the volume row shows
  a speaker icon and a working slider.
- Open the library and artist card, confirm the close buttons show an X icon
  and the layout is visually consistent with the player bar (same corner
  rounding family, same muted-text opacity).
- Check the browser console for new errors (there should be none introduced
  by this change).

- [ ] **Step 6: Update `STATE.md`**

Add a new entry under `## Stopped at` (or a new dated section) in
`STATE.md` at the project root recording that Phase 1 of the design
direction (visual system: tokens, icons, merged seek bar) shipped, and that
Phases 2–4 (entity identity, motion, mobile polish) remain, per
`docs/superpowers/specs/2026-08-05-visual-system-design.md`.
