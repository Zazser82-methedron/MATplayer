# MATplayer Round 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать 16 рекомендаций из отчёта Gemini Deep Research (раунд 2): поднять арт-дирекшн 3D-сцены, довести UI до уровня настоящего плеера, активировать написанный-но-неподключённый код и расширить контент с 5 до 28 треков.

**Architecture:** Все изменения ложатся на существующую архитектуру без её переделки. Чистые вычислительные функции выносятся в отдельные модули с юнит-тестами (`src/lib/**`), React/R3F-компоненты их потребляют. Новый слой `src/lib/audio/loadAudioBuffer.js` (fetch + decodeAudioData) — единственное архитектурное дополнение, он разблокирует сразу и BPM-пульсации, и waveform-скраббер. Воспроизведение остаётся на `<audio>` + `createMediaElementSource` (нативный стриминг не теряем), decodeAudioData используется только для анализа.

**Tech Stack:** React 18, React Three Fiber 8, Drei, @react-three/postprocessing, Zustand 4 (+ persist middleware), Web Audio API, web-audio-beat-detector, Zod, Vite 5, Vitest 2, Playwright.

---

## Контекст: что уже есть (не переделывать)

- `src/three/Atlas.jsx` — 3D-атлас, перелёт камеры по Безье, острова артистов.
- `src/three/ParticleField.jsx` + `src/three/shaders/curlNoiseParticles.js` — частицы на curl-noise, FFT-реактивные.
- `src/three/AvatarProxy.jsx` — toon-аватар, inverted hull контур **уже реализован**, процедурное дыхание/моргание.
- `src/three/ToonPostFX.jsx` — EffectComposer + Bloom + GodRays (GodRays не работает, см. Задачу 4).
- `src/hooks/usePerformanceDegradation.js` + `src/hooks/performanceDegradation.js` — лесенка деградации, замер FPS, `setDpr`.
- `src/store/usePlayerStore.js` — Zustand-стор.
- `src/data/index.js` — агрегация артистов/треков/лирики через `import.meta.glob`.
- `src/lib/library/buildLibrary.js` — библиотека + поиск.
- `src/ui/Library.jsx`, `src/ui/PlayerControls.jsx`, `src/ui/LyricsOverlay.jsx`.

**Тесты:** `npm test` (Vitest, 133 теста на старте плана). Сборка: `npm run build`.

## Три поправки к отчёту Gemini (выявлены сверкой с кодом)

1. **C1** — `computeCrossfadeGains` возвращает **линейный** кроссфейд (`1-t`, `t`), а не equal-power. Это замена формулы + переписывание теста, а не «подключить готовое».
2. **C2/B3** — обе фичи требуют `AudioBuffer`, которого в проекте нет (движок на `createMediaElementSource`). Нужен общий новый шаг `fetch → decodeAudioData` (Задача 12), после него обе становятся дешёвыми.
3. **C3** — лесенка деградации уже написана и работает. Единственный реальный баг: уровень деградации не публикуется в стор, поэтому `ToonPostFX` о нём не знает и **bloom никогда не отключается**. Одинаковые значения частиц на уровнях 0–2 — это замысел (сначала деградирует пост-процессинг), не баг.

## Поправка к C5 (выявлена при подготовке плана)

- В `public/audio/cupsize/` лежат только `01.mp3`, `10.mp3`, `24.mp3`. Остальные 23 — в `C:\Users\exxck\Projects\games\cupsize-v2-story\audio\`. Все 26 весят **174 МБ**.
- `cupsize-v2-story/main.js` содержит массив `TRACKS` с настоящими названиями и авторскими тегами настроения для всех 26 треков — использовать его, а не автогенерацию палитр из RMS.

---

## Структура файлов

**Создаются:**
- `src/three/noiseTypes.js` — маппинг `noise_type` → float для шейдера (+тест)
- `src/lib/color/contrast.js` — WCAG-контраст, выбор цвета текста (+тест)
- `src/lib/player/queue.js` — очередь, shuffle, repeat (+тест)
- `src/lib/player/volume.js` — перцептивная кривая громкости (+тест)
- `src/lib/player/deepLink.js` — разбор/сборка URL с тайм-кодом (+тест)
- `src/lib/audio/loadAudioBuffer.js` — fetch + decodeAudioData + кеш
- `src/lib/audio/beatPulse.js` — фаза доли и импульс из BPM (+тест)
- `src/lib/audio/waveform.js` — пики из PCM (+тест)
- `src/ui/VolumeControl.jsx` (+тест)
- `src/ui/SeekBar.jsx` (+тест)
- `src/ui/QueuePanel.jsx` (+тест)
- `src/ui/ArtistCard.jsx` (+тест)
- `scripts/import-cupsize-tracks.mjs` — генератор профилей для 26 треков

**Модифицируются:**
- `src/three/shaders/curlNoiseParticles.js`, `src/three/ParticleField.jsx`, `src/three/ToonPostFX.jsx`, `src/three/Atlas.jsx`, `src/three/AvatarProxy.jsx`
- `src/hooks/performanceDegradation.js`, `src/hooks/usePerformanceDegradation.js`, `src/hooks/useSwipeGestures.js`
- `src/store/usePlayerStore.js`, `src/lib/audio/crossfade.js`, `src/lib/schema/trackSchema.js`
- `src/App.jsx`, `src/ui/PlayerControls.jsx`, `src/ui/LyricsOverlay.jsx`, `src/index.css`

**Удаляются:**
- `src/three/ArtistScene.jsx` — мёртвый код (свой `<Canvas>`, нигде не импортируется; App.jsx рендерит `Atlas` напрямую)

---

# ФАЗА 1 — Арт-дирекшн (A1–A5) + починка лесенки (C3)

### Task 1: Удалить мёртвый ArtistScene.jsx

**Files:**
- Delete: `src/three/ArtistScene.jsx`

- [ ] **Step 1: Убедиться, что файл нигде не импортируется**

Run: `npx rg "ArtistScene" src/ tests/`
Expected: единственное совпадение — сам файл `src/three/ArtistScene.jsx`. Если найдётся импорт — ОСТАНОВИТЬСЯ и сообщить.

- [ ] **Step 2: Удалить файл**

```bash
git rm src/three/ArtistScene.jsx
```

- [ ] **Step 3: Прогнать тесты и сборку**

Run: `npm test -- --run && npm run build`
Expected: все тесты проходят, сборка успешна.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: remove dead ArtistScene component superseded by Atlas"
```

---

### Task 2: A1 — Порог Bloom и экспозиция

**Контекст:** сейчас `luminanceThreshold={0.2}` — почти всё в кадре ярче этого порога, поэтому светится вся сцена целиком и контуры аватара размываются. Поднимаем порог, чтобы светились только глаза и самые яркие частицы. R3F v8 по умолчанию уже ставит `ACESFilmicToneMapping`, поэтому отдельно его включать не нужно — но экспозицию задаём явно, чтобы она не зависела от версии.

**Files:**
- Modify: `src/three/ToonPostFX.jsx`
- Modify: `src/App.jsx` (проп `gl` у `<Canvas>`)

- [ ] **Step 1: Задать экспозицию явно в App.jsx**

В `src/App.jsx` добавить импорт вверху файла:

```jsx
import * as THREE from 'three'
```

Затем в `<Canvas>` добавить проп `gl` (рядом с существующим `camera`):

```jsx
<Canvas
  camera={{ position: [cameraPosition.x, cameraPosition.y, cameraPosition.z], fov: 50 }}
  gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
  onCreated={() => {
    document.documentElement.dataset.matplayerReady = 'true'
  }}
>
```

- [ ] **Step 2: Поднять порог свечения в ToonPostFX.jsx**

Заменить строку с `<Bloom ...>` на:

```jsx
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={0.82}
        luminanceSmoothing={0.18}
        mipmapBlur
      />
```

- [ ] **Step 3: Проверить сборку**

Run: `npm test -- --run && npm run build`
Expected: тесты проходят, сборка успешна.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx src/three/ToonPostFX.jsx
git commit -m "feat: raise bloom threshold so glow reads as highlights, not a full-frame wash"
```

---

### Task 3: A3 — Разные типы шума под настроение трека

**Контекст:** `shader_presets.noise_type` есть в данных каждого трека и валидируется схемой, но шейдер всегда использует один и тот же curl-noise. Делаем три реально различимых режима.

**Files:**
- Create: `src/three/noiseTypes.js`
- Create: `src/three/noiseTypes.test.js`
- Modify: `src/three/shaders/curlNoiseParticles.js`
- Modify: `src/three/ParticleField.jsx`

- [ ] **Step 1: Написать падающий тест маппинга**

Create `src/three/noiseTypes.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { noiseTypeToFloat, NOISE_TYPE_SIMPLEX_CURLY, NOISE_TYPE_LAMINAR, NOISE_TYPE_TURBULENT_GLITCH } from './noiseTypes.js'

describe('noiseTypeToFloat', () => {
  it('maps each known noise_type to its shader constant', () => {
    expect(noiseTypeToFloat('simplex_curly')).toBe(NOISE_TYPE_SIMPLEX_CURLY)
    expect(noiseTypeToFloat('laminar')).toBe(NOISE_TYPE_LAMINAR)
    expect(noiseTypeToFloat('turbulent_glitch')).toBe(NOISE_TYPE_TURBULENT_GLITCH)
  })

  it('gives every type a distinct value so the shader can branch on them', () => {
    const values = new Set([NOISE_TYPE_SIMPLEX_CURLY, NOISE_TYPE_LAMINAR, NOISE_TYPE_TURBULENT_GLITCH])
    expect(values.size).toBe(3)
  })

  it('falls back to simplex_curly for an unknown type', () => {
    expect(noiseTypeToFloat('nonsense')).toBe(NOISE_TYPE_SIMPLEX_CURLY)
    expect(noiseTypeToFloat(undefined)).toBe(NOISE_TYPE_SIMPLEX_CURLY)
  })
})
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npx vitest run src/three/noiseTypes.test.js`
Expected: FAIL — "Failed to resolve import './noiseTypes.js'".

- [ ] **Step 3: Реализовать маппинг**

Create `src/three/noiseTypes.js`:

```js
// Значения передаются в шейдер как float-uniform uNoiseType.
// Шейдер ветвится по ним через сравнения (< 0.5, < 1.5), поэтому
// значения должны быть целыми и идти подряд.
export const NOISE_TYPE_SIMPLEX_CURLY = 0
export const NOISE_TYPE_LAMINAR = 1
export const NOISE_TYPE_TURBULENT_GLITCH = 2

const BY_NAME = {
  simplex_curly: NOISE_TYPE_SIMPLEX_CURLY,
  laminar: NOISE_TYPE_LAMINAR,
  turbulent_glitch: NOISE_TYPE_TURBULENT_GLITCH,
}

export function noiseTypeToFloat(noiseType) {
  return BY_NAME[noiseType] ?? NOISE_TYPE_SIMPLEX_CURLY
}
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npx vitest run src/three/noiseTypes.test.js`
Expected: PASS (3 теста).

- [ ] **Step 5: Добавить в шейдер функцию выбора потока**

В `src/three/shaders/curlNoiseParticles.js` в `vertexShader` добавить uniform после `uniform float uPointSize;`:

```glsl
uniform float uNoiseType;
```

Затем сразу после вставки `${CURL_NOISE_GLSL}` (перед `void main()`) добавить:

```glsl
// Три режима потока частиц под настроение трека (shader_presets.noise_type).
// Ветвление идёт по uniform — одинаково для всех вершин, дивергенции нет.
vec3 flowField(vec3 p, float t) {
  if (uNoiseType < 0.5) {
    // simplex_curly — органические вихри, базовый режим
    return curlNoise(p * 0.5);
  }
  if (uNoiseType < 1.5) {
    // laminar — выраженный направленный дрейф вверх с лёгким возмущением
    vec3 drift = vec3(0.12, 1.0, 0.12);
    return normalize(drift + curlNoise(p * 0.22) * 0.25);
  }
  // turbulent_glitch — дискретизация времени даёт скачкообразные разрывы,
  // domain warping — рваную, «сломанную» структуру потока
  float qt = floor(t * 12.0) / 12.0;
  vec3 warp = vec3(snoise(p * 1.7 + qt), snoise(p * 1.9 - qt), snoise(p * 2.1 + qt));
  return curlNoise(p * 0.8 + warp * 0.6);
}
```

- [ ] **Step 6: Использовать flowField в main()**

В том же файле заменить строку:

```glsl
  vec3 target = aOriginal + aNormal * 0.1 + curlNoise(position * 0.5) * uAmplitude;
```

на:

```glsl
  vec3 target = aOriginal + aNormal * 0.1 + flowField(position, uTime) * uAmplitude;
```

- [ ] **Step 7: Прокинуть uniform из ParticleField**

В `src/three/ParticleField.jsx` добавить импорт:

```jsx
import { noiseTypeToFloat } from './noiseTypes.js'
```

Изменить сигнатуру компонента:

```jsx
export function ParticleField({ count = 2000, palette, noiseType }) {
```

В объекте `uniforms` добавить поле (после `uPointSize`):

```jsx
      uNoiseType: { value: noiseTypeToFloat(noiseType) },
```

и добавить `noiseType` в массив зависимостей `useMemo`:

```jsx
    [palette, noiseType],
```

- [ ] **Step 8: Передать noise_type из Atlas**

В `src/three/Atlas.jsx` заменить строку с `<ParticleField ... />` на:

```jsx
      <ParticleField palette={track.color_palette} noiseType={track.shader_presets.noise_type} />
```

- [ ] **Step 9: Прогнать все тесты и сборку**

Run: `npm test -- --run && npm run build`
Expected: все тесты проходят (133 + 3 новых = 136), сборка успешна.

- [ ] **Step 10: Commit**

```bash
git add src/three/noiseTypes.js src/three/noiseTypes.test.js src/three/shaders/curlNoiseParticles.js src/three/ParticleField.jsx src/three/Atlas.jsx
git commit -m "feat: render three distinct particle flow modes from track noise_type"
```

---

### Task 4: A4 — Активировать God Rays

**Контекст:** `<GodRays sun={godRaysSource} />` в `ToonPostFX` рендерится только если `godRaysSource` не null, но этот проп никто никогда не передаёт — эффект физически не может сработать. Нужен меш-источник в сцене, ref которого передаётся в эффект. Ref берём через `useState`, а не `useRef`: `useRef` не вызывает ре-рендер при появлении меша, и эффект так и останется выключенным.

**Files:**
- Modify: `src/three/Atlas.jsx`

- [ ] **Step 1: Добавить состояние для меша-источника**

В `src/three/Atlas.jsx` изменить импорт React:

```jsx
import { useEffect, useRef, useState } from 'react'
```

- [ ] **Step 2: Создать меш-источник и передать его в ToonPostFX**

Заменить целиком тело ветки `return` в `ArtistIsland` (активный остров) на:

```jsx
  return (
    <group position={[x, y, z]} name={`island-active-${artist.artist_id}`}>
      <fogExp2 attach="fog" args={[track.color_palette.background, 0.08]} />
      <ambientLight intensity={0.6} />
      <pointLight position={[3, 3, 3]} intensity={1.2} />
      <AvatarProxy
        palette={track.color_palette}
        energy={track.energy}
        outlineThickness={track.shader_presets.outline_thickness}
      />
      <ParticleField palette={track.color_palette} noiseType={track.shader_presets.noise_type} />
      {/* Источник для God Rays: лучи расходятся от этого меша, поэтому он стоит
          позади аватара — так они пробиваются из-за силуэта. Он должен быть
          настоящим отрендеренным мешем, невидимый меш лучей не даёт. */}
      <mesh ref={setSunMesh} position={[0, 1.2, -3]} name="godrays-sun">
        <sphereGeometry args={[0.7, 24, 24]} />
        <meshBasicMaterial color={track.color_palette.secondary} />
      </mesh>
      <ToonPostFX
        bloomIntensity={track.shader_presets.bloom_intensity}
        moodIsMelancholic={track.mood.startsWith('melancholic')}
        godRaysSource={sunMesh}
      />
    </group>
  )
```

- [ ] **Step 3: Объявить состояние в ArtistIsland**

В начало функции `ArtistIsland`, сразу после `const { x, y, z } = artist.atlas_position`, добавить:

```jsx
  const [sunMesh, setSunMesh] = useState(null)
```

Важно: этот вызов должен идти **до** раннего `return` для неактивного острова — иначе React ругнётся на условный хук. Порядок: деструктуризация позиции → `useState` → `if (!isActive) return ...`.

- [ ] **Step 4: Прогнать тесты и сборку**

Run: `npm test -- --run && npm run build`
Expected: все тесты проходят, сборка успешна.

- [ ] **Step 5: Commit**

```bash
git add src/three/Atlas.jsx
git commit -m "feat: wire a real sun mesh into GodRays so the effect can actually run"
```

---

### Task 5: A5 — Контраст лирики по WCAG

**Files:**
- Create: `src/lib/color/contrast.js`
- Create: `src/lib/color/contrast.test.js`
- Modify: `src/ui/LyricsOverlay.jsx`
- Modify: `src/App.jsx`
- Modify: `src/index.css`

- [ ] **Step 1: Написать падающий тест**

Create `src/lib/color/contrast.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { relativeLuminance, contrastRatio, pickReadableTextColor } from './contrast.js'

describe('relativeLuminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5)
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5)
  })
})

describe('contrastRatio', () => {
  it('is 21 for black on white (the maximum)', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1)
  })

  it('is 1 for a colour against itself', () => {
    expect(contrastRatio('#ff0055', '#ff0055')).toBeCloseTo(1, 5)
  })

  it('is symmetric regardless of argument order', () => {
    expect(contrastRatio('#0d0101', '#ffffff')).toBeCloseTo(contrastRatio('#ffffff', '#0d0101'), 5)
  })
})

describe('pickReadableTextColor', () => {
  it('picks white text on a dark background', () => {
    expect(pickReadableTextColor('#0d0101')).toBe('#ffffff')
  })

  it('picks near-black text on a light background', () => {
    expect(pickReadableTextColor('#f2ede6')).toBe('#0a0a0a')
  })

  it('always returns a colour meeting WCAG AA (4.5:1) against the background', () => {
    for (const bg of ['#0d0101', '#f2ede6', '#808080', '#00e5ff', '#0f1420']) {
      expect(contrastRatio(pickReadableTextColor(bg), bg)).toBeGreaterThanOrEqual(4.5)
    }
  })
})
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npx vitest run src/lib/color/contrast.test.js`
Expected: FAIL — "Failed to resolve import './contrast.js'".

- [ ] **Step 3: Реализовать**

Create `src/lib/color/contrast.js`:

```js
// Формулы относительной яркости и коэффициента контрастности — WCAG 2.1,
// https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
function hexToRgbChannels(hex) {
  const normalized = hex.replace('#', '')
  return [
    parseInt(normalized.slice(0, 2), 16) / 255,
    parseInt(normalized.slice(2, 4), 16) / 255,
    parseInt(normalized.slice(4, 6), 16) / 255,
  ]
}

function linearize(channel) {
  return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
}

export function relativeLuminance(hex) {
  const [r, g, b] = hexToRgbChannels(hex).map(linearize)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(hexA, hexB) {
  const lumA = relativeLuminance(hexA)
  const lumB = relativeLuminance(hexB)
  const lighter = Math.max(lumA, lumB)
  const darker = Math.min(lumA, lumB)
  return (lighter + 0.05) / (darker + 0.05)
}

const LIGHT_TEXT = '#ffffff'
const DARK_TEXT = '#0a0a0a'

// Возвращает тот из двух вариантов, что даёт больший контраст. Так как это
// почти чистые чёрный и белый, хотя бы один из них всегда даёт >= 4.5:1
// на любом фоне — гарантия WCAG AA без ручной настройки палитр.
export function pickReadableTextColor(backgroundHex) {
  return contrastRatio(LIGHT_TEXT, backgroundHex) >= contrastRatio(DARK_TEXT, backgroundHex)
    ? LIGHT_TEXT
    : DARK_TEXT
}
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npx vitest run src/lib/color/contrast.test.js`
Expected: PASS (7 тестов).

- [ ] **Step 5: Применить цвет в LyricsOverlay**

Заменить `src/ui/LyricsOverlay.jsx` целиком на:

```jsx
import { usePlayerStore } from '../store/usePlayerStore.js'
import { getCurrentLineIndex } from '../lib/lyrics/lyricsSync.js'

export function LyricsOverlay({ lines, reducedMotion, textColor = '#ffffff' }) {
  const lineIndex = usePlayerStore((state) => getCurrentLineIndex(lines, state.currentTime))
  const currentText = lineIndex >= 0 ? lines[lineIndex].text : ''

  return (
    <>
      <div
        className="lyrics-overlay"
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
```

- [ ] **Step 6: Передать вычисленный цвет из App.jsx**

В `src/App.jsx` добавить импорт:

```jsx
import { pickReadableTextColor } from './lib/color/contrast.js'
```

Заменить строку рендера `<LyricsOverlay ... />` на:

```jsx
      <LyricsOverlay
        lines={activeLyrics}
        reducedMotion={reducedMotion}
        textColor={pickReadableTextColor(activeTrack.color_palette.background)}
      />
```

- [ ] **Step 7: Добавить подложку под текст в CSS**

В `src/index.css` в правило `.lyrics-overlay` добавить (перед `pointer-events`):

```css
  padding: 10px 18px;
  border-radius: 14px;
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  background: rgba(0, 0, 0, 0.28);
```

и убрать из этого же правила жёстко заданный `color: #ffffff;` — цвет теперь приходит инлайн-стилем.

- [ ] **Step 8: Прогнать все тесты и сборку**

Run: `npm test -- --run && npm run build`
Expected: все тесты проходят, сборка успешна.

- [ ] **Step 9: Commit**

```bash
git add src/lib/color/ src/ui/LyricsOverlay.jsx src/App.jsx src/index.css
git commit -m "feat: guarantee WCAG AA lyric contrast on any track background"
```

---

### Task 6: C3 — Починить лесенку деградации (bloom реально отключается)

**Контекст:** `computeDegradationLevel` считает уровень корректно, но результат используется только для количества частиц. Уровень не попадает в стор, поэтому `ToonPostFX` о нём не знает и ступени `no-bloom`/`no-postfx` ничего не делают. Одинаковое число частиц на уровнях 0–2 — это замысел (пост-процессинг деградирует раньше частиц), менять не нужно.

**Files:**
- Modify: `src/store/usePlayerStore.js`
- Modify: `src/hooks/usePerformanceDegradation.js`
- Modify: `src/three/ToonPostFX.jsx`
- Modify: `src/three/Atlas.jsx`
- Create: `src/hooks/degradationEffects.test.js`
- Modify: `src/hooks/performanceDegradation.js`
- Modify: `src/store/usePlayerStore.test.js`

- [ ] **Step 1: Написать падающий тест на предикаты эффектов**

Create `src/hooks/degradationEffects.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { DEGRADATION_LEVELS, isBloomEnabledAtLevel, isPostFxEnabledAtLevel } from './performanceDegradation.js'

describe('degradation effect predicates', () => {
  it('keeps bloom on only at the full level', () => {
    expect(isBloomEnabledAtLevel(DEGRADATION_LEVELS.indexOf('full'))).toBe(true)
    expect(isBloomEnabledAtLevel(DEGRADATION_LEVELS.indexOf('no-bloom'))).toBe(false)
    expect(isBloomEnabledAtLevel(DEGRADATION_LEVELS.indexOf('no-postfx'))).toBe(false)
  })

  it('keeps post-processing on until the no-postfx level', () => {
    expect(isPostFxEnabledAtLevel(DEGRADATION_LEVELS.indexOf('full'))).toBe(true)
    expect(isPostFxEnabledAtLevel(DEGRADATION_LEVELS.indexOf('no-bloom'))).toBe(true)
    expect(isPostFxEnabledAtLevel(DEGRADATION_LEVELS.indexOf('no-postfx'))).toBe(false)
    expect(isPostFxEnabledAtLevel(DEGRADATION_LEVELS.indexOf('flat-2d'))).toBe(false)
  })
})
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npx vitest run src/hooks/degradationEffects.test.js`
Expected: FAIL — "isBloomEnabledAtLevel is not a function".

- [ ] **Step 3: Добавить предикаты**

В конец `src/hooks/performanceDegradation.js` добавить:

```js
export function isBloomEnabledAtLevel(levelIndex) {
  return levelIndex < DEGRADATION_LEVELS.indexOf('no-bloom')
}

export function isPostFxEnabledAtLevel(levelIndex) {
  return levelIndex < DEGRADATION_LEVELS.indexOf('no-postfx')
}
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npx vitest run src/hooks/degradationEffects.test.js`
Expected: PASS (2 теста).

- [ ] **Step 5: Публиковать уровень в стор**

В `src/store/usePlayerStore.js` добавить поле состояния после `particleVisibleCount: 2000,`:

```js
  degradationLevel: 0,
```

и сеттер после `setParticleVisibleCount`:

```js
  setDegradationLevel: (levelIndex) => set({ degradationLevel: levelIndex }),
```

- [ ] **Step 6: Дополнить тест стора**

В `src/store/usePlayerStore.test.js` в объект `defaults` добавить строку:

```js
  degradationLevel: 0,
```

и добавить новый тест перед закрывающей скобкой `describe`:

```js
  it('setDegradationLevel updates degradationLevel', () => {
    usePlayerStore.getState().setDegradationLevel(2)
    expect(usePlayerStore.getState().degradationLevel).toBe(2)
  })
```

- [ ] **Step 7: Записывать уровень из хука деградации**

В `src/hooks/usePerformanceDegradation.js` внутри блока `if (nextLevelIndex !== levelIndexRef.current) { ... }` добавить строку после `setParticleVisibleCount(...)`:

```js
      usePlayerStore.getState().setDegradationLevel(nextLevelIndex)
```

- [ ] **Step 8: Потреблять уровень в ToonPostFX**

Заменить `src/three/ToonPostFX.jsx` целиком на:

```jsx
import { EffectComposer, Bloom, GodRays } from '@react-three/postprocessing'

export function ToonPostFX({
  bloomIntensity = 1.2,
  godRaysSource = null,
  moodIsMelancholic = false,
  bloomEnabled = true,
  postFxEnabled = true,
}) {
  // На нижних ступенях деградации весь пост-процессинг снимается целиком:
  // пустой EffectComposer всё равно стоит одного полноэкранного прохода,
  // поэтому дешевле не монтировать его вовсе.
  if (!postFxEnabled) return null

  return (
    <EffectComposer>
      {bloomEnabled && (
        <Bloom
          intensity={bloomIntensity}
          luminanceThreshold={0.82}
          luminanceSmoothing={0.18}
          mipmapBlur
        />
      )}
      {moodIsMelancholic && godRaysSource && (
        <GodRays sun={godRaysSource} exposure={0.34} decay={0.9} blur />
      )}
    </EffectComposer>
  )
}
```

- [ ] **Step 9: Прокинуть флаги из Atlas**

В `src/three/Atlas.jsx` добавить импорты:

```jsx
import { isBloomEnabledAtLevel, isPostFxEnabledAtLevel } from '../hooks/performanceDegradation.js'
```

В `ArtistIsland` после `const [sunMesh, setSunMesh] = useState(null)` добавить:

```jsx
  const degradationLevel = usePlayerStore((s) => s.degradationLevel)
```

И заменить рендер `<ToonPostFX ... />` на:

```jsx
      <ToonPostFX
        bloomIntensity={track.shader_presets.bloom_intensity}
        moodIsMelancholic={track.mood.startsWith('melancholic')}
        godRaysSource={sunMesh}
        bloomEnabled={isBloomEnabledAtLevel(degradationLevel)}
        postFxEnabled={isPostFxEnabledAtLevel(degradationLevel)}
      />
```

- [ ] **Step 10: Прогнать все тесты и сборку**

Run: `npm test -- --run && npm run build`
Expected: все тесты проходят, сборка успешна.

- [ ] **Step 11: Commit**

```bash
git add src/store/usePlayerStore.js src/store/usePlayerStore.test.js src/hooks/performanceDegradation.js src/hooks/degradationEffects.test.js src/hooks/usePerformanceDegradation.js src/three/ToonPostFX.jsx src/three/Atlas.jsx
git commit -m "fix: degradation level never reached the post-FX stack, so bloom never turned off"
```

---

### Task 7: A2 — Ступенчатая toon-рампа на аватаре

**Контекст:** inverted hull контур уже есть. Недостаёт дискретной рампы освещения — без неё `meshToonMaterial` даёт почти плоскую заливку. Рампу генерируем как 1D `DataTexture` с `NearestFilter` — три ступени.

**Files:**
- Modify: `src/three/AvatarProxy.jsx`

- [ ] **Step 1: Добавить генерацию градиентной карты**

В `src/three/AvatarProxy.jsx` изменить импорт React:

```jsx
import { useMemo, useRef } from 'react'
```

Добавить после импортов, перед `export function AvatarProxy`:

```jsx
// Трёхступенчатая рампа освещения для meshToonMaterial. NearestFilter
// обязателен: с линейной фильтрацией ступени размываются обратно в
// градиент и toon-эффект пропадает.
function useToonGradientMap() {
  return useMemo(() => {
    const steps = new Uint8Array([80, 160, 255])
    const texture = new THREE.DataTexture(steps, steps.length, 1, THREE.RedFormat)
    texture.minFilter = THREE.NearestFilter
    texture.magFilter = THREE.NearestFilter
    texture.generateMipmaps = false
    texture.needsUpdate = true
    return texture
  }, [])
}
```

- [ ] **Step 2: Применить рампу к материалу тела**

В теле компонента добавить первой строкой:

```jsx
  const gradientMap = useToonGradientMap()
```

и заменить материал тела:

```jsx
        <meshToonMaterial color={palette.primary} gradientMap={gradientMap} />
```

- [ ] **Step 3: Прогнать тесты и сборку**

Run: `npm test -- --run && npm run build`
Expected: все тесты проходят, сборка успешна.

- [ ] **Step 4: Commit**

```bash
git add src/three/AvatarProxy.jsx
git commit -m "feat: add a three-step toon gradient ramp so the avatar reads as cel-shaded"
```

---

### Task 8: Проверить Фазу 1 вживую на задеплоенном сайте

**Контекст:** песочница не достучится до localhost (проверено многократно) — визуальная проверка идёт через задеплоенный сайт. Юнит-тесты не доказывают, что сцена выглядит правильно: именно так в прошлый раз проехал баг с частицами в 1000 px.

- [ ] **Step 1: Запушить и дождаться деплоя**

```bash
git push origin master
gh run watch $(gh run list --limit 1 --json databaseId --jq '.[0].databaseId') --exit-status
```
Expected: workflow завершается успешно.

- [ ] **Step 2: Открыть сайт с обходом кеша и снять скриншот**

Открыть `https://zazser82-methedron.github.io/MATplayer/?v=phase1` через Playwright MCP, дождаться `html[data-matplayer-ready="true"]`, снять скриншот.

Проверить глазами:
- аватар различим, контуры не размыты свечением (A1);
- на гранях аватара видны 2–3 ступени света, а не плавный градиент (A2);
- частицы движутся, у агрессивного трека — рвано (A3).

- [ ] **Step 3: Проверить консоль на ошибки**

Ожидается: только `favicon.ico` 404. Любая ошибка про шейдер/GLSL/`GodRays` — блокирующая, чинить до перехода к Фазе 2.

- [ ] **Step 4: Переключиться на меланхоличный трек и проверить God Rays**

В библиотеке выбрать трек с `mood`, начинающимся на `melancholic` (например `Flowers` у Cupsize). Убедиться на скриншоте, что от меша-источника позади аватара идут лучи (A4).

---

# ФАЗА 2 — Функции плеера (B1, B2, B4, B5)

### Task 9: B2 — Громкость с перцептивной кривой

**Files:**
- Create: `src/lib/player/volume.js`
- Create: `src/lib/player/volume.test.js`
- Create: `src/ui/VolumeControl.jsx`
- Create: `src/ui/VolumeControl.test.jsx`
- Modify: `src/App.jsx`, `src/ui/PlayerControls.jsx`, `src/index.css`

- [ ] **Step 1: Написать падающий тест**

Create `src/lib/player/volume.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { uiVolumeToGain, gainToUiVolume, clampVolume } from './volume.js'

describe('uiVolumeToGain', () => {
  it('maps the endpoints exactly', () => {
    expect(uiVolumeToGain(0)).toBe(0)
    expect(uiVolumeToGain(1)).toBe(1)
  })

  it('is quieter than linear in the middle, matching perceived loudness', () => {
    expect(uiVolumeToGain(0.5)).toBeCloseTo(0.125, 5)
    expect(uiVolumeToGain(0.5)).toBeLessThan(0.5)
  })

  it('is monotonically increasing', () => {
    let previous = -1
    for (let v = 0; v <= 1.0001; v += 0.1) {
      const gain = uiVolumeToGain(v)
      expect(gain).toBeGreaterThan(previous)
      previous = gain
    }
  })
})

describe('gainToUiVolume', () => {
  it('round-trips with uiVolumeToGain', () => {
    for (const v of [0, 0.25, 0.5, 0.75, 1]) {
      expect(gainToUiVolume(uiVolumeToGain(v))).toBeCloseTo(v, 5)
    }
  })
})

describe('clampVolume', () => {
  it('keeps values inside 0..1', () => {
    expect(clampVolume(-0.5)).toBe(0)
    expect(clampVolume(1.5)).toBe(1)
    expect(clampVolume(0.3)).toBe(0.3)
  })
})
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npx vitest run src/lib/player/volume.test.js`
Expected: FAIL — "Failed to resolve import './volume.js'".

- [ ] **Step 3: Реализовать**

Create `src/lib/player/volume.js`:

```js
// Слух воспринимает громкость логарифмически: линейный слайдер ощущается
// так, будто вся регулировка происходит в нижней четверти хода. Куб —
// дешёвое и общепринятое приближение перцептивной кривой.
const CURVE_EXPONENT = 3

export function clampVolume(value) {
  return Math.min(1, Math.max(0, value))
}

export function uiVolumeToGain(uiVolume) {
  return Math.pow(clampVolume(uiVolume), CURVE_EXPONENT)
}

export function gainToUiVolume(gain) {
  return Math.pow(clampVolume(gain), 1 / CURVE_EXPONENT)
}
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npx vitest run src/lib/player/volume.test.js`
Expected: PASS (5 тестов).

- [ ] **Step 5: Написать падающий тест компонента**

Create `src/ui/VolumeControl.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VolumeControl } from './VolumeControl.jsx'

describe('VolumeControl', () => {
  it('renders a labelled slider reflecting the current volume', () => {
    render(<VolumeControl uiVolume={0.5} isMuted={false} onChange={() => {}} onToggleMute={() => {}} />)
    const slider = screen.getByRole('slider', { name: 'Volume' })
    expect(slider).toHaveValue('0.5')
  })

  it('reports the new UI volume on change', () => {
    const onChange = vi.fn()
    render(<VolumeControl uiVolume={0.5} isMuted={false} onChange={onChange} onToggleMute={() => {}} />)
    fireEvent.change(screen.getByRole('slider', { name: 'Volume' }), { target: { value: '0.8' } })
    expect(onChange).toHaveBeenCalledWith(0.8)
  })

  it('exposes mute state through aria-pressed', () => {
    render(<VolumeControl uiVolume={0.5} isMuted onChange={() => {}} onToggleMute={() => {}} />)
    expect(screen.getByRole('button', { name: 'Mute' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls onToggleMute when the mute button is clicked', () => {
    const onToggleMute = vi.fn()
    render(<VolumeControl uiVolume={0.5} isMuted={false} onChange={() => {}} onToggleMute={onToggleMute} />)
    fireEvent.click(screen.getByRole('button', { name: 'Mute' }))
    expect(onToggleMute).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 6: Запустить тест — убедиться, что падает**

Run: `npx vitest run src/ui/VolumeControl.test.jsx`
Expected: FAIL — "Failed to resolve import './VolumeControl.jsx'".

- [ ] **Step 7: Реализовать компонент**

Create `src/ui/VolumeControl.jsx`:

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

- [ ] **Step 8: Запустить тест — убедиться, что проходит**

Run: `npx vitest run src/ui/VolumeControl.test.jsx`
Expected: PASS (4 теста).

- [ ] **Step 9: Подключить в App.jsx**

В `src/App.jsx` добавить импорт:

```jsx
import { uiVolumeToGain, clampVolume } from './lib/player/volume.js'
```

Добавить состояние рядом с `isLibraryOpen`:

```jsx
  const [uiVolume, setUiVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
```

Добавить эффект применения громкости (после эффекта перезагрузки аудио):

```jsx
  useEffect(() => {
    const audioEl = audioRef.current
    if (!audioEl) return
    audioEl.volume = isMuted ? 0 : uiVolumeToGain(uiVolume)
  }, [uiVolume, isMuted])
```

Заменить обработчики стрелок вверх/вниз в `handleKeyDown` (они сейчас пишут в `audioEl.volume` напрямую, минуя кривую и состояние):

```jsx
      } else if (event.key === 'ArrowUp') {
        setUiVolume((v) => clampVolume(v + VOLUME_STEP))
      } else if (event.key === 'ArrowDown') {
        setUiVolume((v) => clampVolume(v - VOLUME_STEP))
      }
```

Передать в `PlayerControls` новые пропсы:

```jsx
        uiVolume={uiVolume}
        isMuted={isMuted}
        onVolumeChange={setUiVolume}
        onToggleMute={() => setIsMuted((muted) => !muted)}
```

- [ ] **Step 10: Отрендерить в PlayerControls**

В `src/ui/PlayerControls.jsx` добавить импорт:

```jsx
import { VolumeControl } from './VolumeControl.jsx'
```

Добавить в деструктуризацию пропсов: `uiVolume, isMuted, onVolumeChange, onToggleMute`.

Вставить перед кнопкой `Library`:

```jsx
      <VolumeControl
        uiVolume={uiVolume}
        isMuted={isMuted}
        onChange={onVolumeChange}
        onToggleMute={onToggleMute}
      />
```

- [ ] **Step 11: Стили**

В `src/index.css` добавить в конец:

```css
.volume-control {
  display: flex;
  align-items: center;
  gap: 6px;
}

.volume-control__slider {
  width: 84px;
  accent-color: #f2ede6;
  cursor: pointer;
}
```

- [ ] **Step 12: Прогнать все тесты и сборку**

Run: `npm test -- --run && npm run build`
Expected: все тесты проходят, сборка успешна.

- [ ] **Step 13: Commit**

```bash
git add src/lib/player/volume.js src/lib/player/volume.test.js src/ui/VolumeControl.jsx src/ui/VolumeControl.test.jsx src/App.jsx src/ui/PlayerControls.jsx src/index.css
git commit -m "feat: add volume slider with a perceptual cubic curve"
```

---

### Task 10: B1 — Очередь, shuffle, repeat

**Files:**
- Create: `src/lib/player/queue.js`, `src/lib/player/queue.test.js`
- Create: `src/ui/QueuePanel.jsx`, `src/ui/QueuePanel.test.jsx`
- Modify: `src/store/usePlayerStore.js`, `src/App.jsx`, `src/ui/PlayerControls.jsx`, `src/index.css`

- [ ] **Step 1: Написать падающий тест**

Create `src/lib/player/queue.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { REPEAT_MODES, nextRepeatMode, computeNextIndex, buildShuffledOrder } from './queue.js'

describe('nextRepeatMode', () => {
  it('cycles off -> all -> one -> off', () => {
    expect(nextRepeatMode('off')).toBe('all')
    expect(nextRepeatMode('all')).toBe('one')
    expect(nextRepeatMode('one')).toBe('off')
  })

  it('only ever returns a known mode', () => {
    expect(REPEAT_MODES).toContain(nextRepeatMode('one'))
  })
})

describe('computeNextIndex', () => {
  it('advances by one in the middle of the queue', () => {
    expect(computeNextIndex(1, 4, 'off', 1)).toBe(2)
  })

  it('stops at the end when repeat is off', () => {
    expect(computeNextIndex(3, 4, 'off', 1)).toBeNull()
  })

  it('wraps to the start when repeat is all', () => {
    expect(computeNextIndex(3, 4, 'all', 1)).toBe(0)
  })

  it('stays on the same track when repeat is one', () => {
    expect(computeNextIndex(2, 4, 'one', 1)).toBe(2)
  })

  it('wraps backwards from the first track when repeat is all', () => {
    expect(computeNextIndex(0, 4, 'all', -1)).toBe(3)
  })

  it('stops before the start when going back with repeat off', () => {
    expect(computeNextIndex(0, 4, 'off', -1)).toBeNull()
  })

  it('returns null for an empty queue', () => {
    expect(computeNextIndex(0, 0, 'all', 1)).toBeNull()
  })
})

describe('buildShuffledOrder', () => {
  it('is a permutation of all indices', () => {
    const order = buildShuffledOrder(5, () => 0.5)
    expect([...order].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4])
  })

  it('puts the requested track first so shuffling does not interrupt playback', () => {
    const order = buildShuffledOrder(5, () => 0.5, 3)
    expect(order[0]).toBe(3)
  })

  it('returns an empty array for an empty queue', () => {
    expect(buildShuffledOrder(0, () => 0.5)).toEqual([])
  })
})
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npx vitest run src/lib/player/queue.test.js`
Expected: FAIL — "Failed to resolve import './queue.js'".

- [ ] **Step 3: Реализовать**

Create `src/lib/player/queue.js`:

```js
export const REPEAT_MODES = ['off', 'all', 'one']

export function nextRepeatMode(mode) {
  const index = REPEAT_MODES.indexOf(mode)
  return REPEAT_MODES[(index + 1) % REPEAT_MODES.length]
}

// Возвращает следующий индекс в очереди либо null, если двигаться некуда
// (конец очереди при repeat: off) — вызывающий код трактует null как «стоп».
export function computeNextIndex(currentIndex, queueLength, repeatMode, direction) {
  if (queueLength <= 0) return null
  if (repeatMode === 'one') return currentIndex
  const candidate = currentIndex + direction
  if (candidate >= 0 && candidate < queueLength) return candidate
  if (repeatMode === 'all') return (candidate + queueLength) % queueLength
  return null
}

// Перемешивание Фишера—Йетса. Источник случайности передаётся параметром,
// чтобы тест был детерминированным. Если задан firstIndex, этот трек
// ставится в начало — иначе включение shuffle обрывало бы текущий трек.
export function buildShuffledOrder(queueLength, random = Math.random, firstIndex = null) {
  const order = Array.from({ length: queueLength }, (_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  if (firstIndex !== null && order.length > 0) {
    const position = order.indexOf(firstIndex)
    if (position > 0) {
      ;[order[0], order[position]] = [order[position], order[0]]
    }
  }
  return order
}
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npx vitest run src/lib/player/queue.test.js`
Expected: PASS (12 тестов).

- [ ] **Step 5: Добавить состояние очереди в стор**

В `src/store/usePlayerStore.js` добавить поля после `degradationLevel: 0,`:

```js
  repeatMode: 'off', // 'off' | 'all' | 'one'
  isShuffled: false,
  shuffledOrder: [],
```

и сеттеры:

```js
  setRepeatMode: (mode) => set({ repeatMode: mode }),
  setShuffle: (isShuffled, shuffledOrder) => set({ isShuffled, shuffledOrder }),
```

- [ ] **Step 6: Написать падающий тест панели очереди**

Create `src/ui/QueuePanel.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueuePanel } from './QueuePanel.jsx'

const entries = [
  { trackId: 't1', title: 'One', artistName: 'A' },
  { trackId: 't2', title: 'Two', artistName: 'A' },
]

describe('QueuePanel', () => {
  it('renders nothing when closed', () => {
    render(<QueuePanel entries={entries} isOpen={false} activeTrackId="t1" onSelect={() => {}} onClose={() => {}} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('lists the queue in order and marks the active track', () => {
    render(<QueuePanel entries={entries} isOpen activeTrackId="t2" onSelect={() => {}} onClose={() => {}} />)
    expect(screen.getByRole('button', { name: /Two/ })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: /One/ })).not.toHaveAttribute('aria-current')
  })

  it('reports the picked track id', () => {
    const onSelect = vi.fn()
    render(<QueuePanel entries={entries} isOpen activeTrackId="t1" onSelect={onSelect} onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /Two/ }))
    expect(onSelect).toHaveBeenCalledWith('t2')
  })
})
```

- [ ] **Step 7: Запустить тест — убедиться, что падает**

Run: `npx vitest run src/ui/QueuePanel.test.jsx`
Expected: FAIL — "Failed to resolve import './QueuePanel.jsx'".

- [ ] **Step 8: Реализовать панель**

Create `src/ui/QueuePanel.jsx`:

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
      <ol className="queue-panel__list">
        {entries.map((entry) => (
          <li key={entry.trackId}>
            <button
              type="button"
              className="queue-panel__row"
              aria-current={entry.trackId === activeTrackId ? 'true' : undefined}
              onClick={() => onSelect(entry.trackId)}
            >
              <span className="queue-panel__title">{entry.title}</span>
              <span className="queue-panel__artist">{entry.artistName}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
```

- [ ] **Step 9: Запустить тест — убедиться, что проходит**

Run: `npx vitest run src/ui/QueuePanel.test.jsx`
Expected: PASS (3 теста).

- [ ] **Step 10: Подключить очередь в App.jsx**

Добавить импорты:

```jsx
import { QueuePanel } from './ui/QueuePanel.jsx'
import { nextRepeatMode, computeNextIndex, buildShuffledOrder } from './lib/player/queue.js'
```

Добавить состояние:

```jsx
  const [isQueueOpen, setIsQueueOpen] = useState(false)
```

Заменить функцию `switchTrack` (объявлена вне компонента) на версию, учитывающую shuffle и repeat:

```jsx
function switchTrack(direction) {
  const store = usePlayerStore.getState()
  const artist = findArtist(store.currentArtistId)
  const ids = artist.track_ids
  // При включённом shuffle порядок обхода берётся из перемешанной
  // последовательности, но сам список треков артиста не трогается —
  // выключение shuffle возвращает исходный порядок альбома.
  const order = store.isShuffled && store.shuffledOrder.length === ids.length
    ? store.shuffledOrder
    : ids.map((_, i) => i)
  const currentPosition = order.indexOf(ids.indexOf(store.currentTrackId))
  const nextPosition = computeNextIndex(currentPosition, order.length, store.repeatMode, direction)
  if (nextPosition === null) return
  store.setTrack(ids[order[nextPosition]])
}
```

Передать в `PlayerControls`:

```jsx
        repeatMode={usePlayerStore.getState().repeatMode}
        onCycleRepeat={() => usePlayerStore.getState().setRepeatMode(nextRepeatMode(usePlayerStore.getState().repeatMode))}
        isShuffled={isShuffled}
        onToggleShuffle={() => {
          const artist = findArtist(currentArtistId)
          const store = usePlayerStore.getState()
          if (store.isShuffled) {
            store.setShuffle(false, [])
          } else {
            const currentIndex = artist.track_ids.indexOf(activeTrack.track_id)
            store.setShuffle(true, buildShuffledOrder(artist.track_ids.length, Math.random, currentIndex))
          }
        }}
        isQueueOpen={isQueueOpen}
        onToggleQueue={() => setIsQueueOpen((open) => !open)}
```

Добавить реактивные подписки рядом с остальными:

```jsx
  const repeatMode = usePlayerStore((s) => s.repeatMode)
  const isShuffled = usePlayerStore((s) => s.isShuffled)
```

и использовать `repeatMode` вместо `usePlayerStore.getState().repeatMode` в пропсе выше.

Отрендерить панель рядом с `<Library ... />`:

```jsx
      <QueuePanel
        entries={libraryEntries.filter((e) => e.artistId === activeArtist.artist_id)}
        isOpen={isQueueOpen}
        activeTrackId={activeTrack.track_id}
        onSelect={(trackId) => {
          usePlayerStore.getState().setTrack(trackId)
          setIsQueueOpen(false)
        }}
        onClose={() => setIsQueueOpen(false)}
      />
```

- [ ] **Step 11: Кнопки в PlayerControls**

В `src/ui/PlayerControls.jsx` добавить в деструктуризацию: `repeatMode, onCycleRepeat, isShuffled, onToggleShuffle, isQueueOpen, onToggleQueue`.

Вставить перед кнопкой `Library`:

```jsx
      <button type="button" onClick={onToggleShuffle} aria-pressed={isShuffled} aria-label="Shuffle">
        🔀
      </button>
      <button type="button" onClick={onCycleRepeat} aria-label={`Repeat: ${repeatMode}`}>
        {repeatMode === 'one' ? '🔂' : '🔁'}
      </button>
      <button type="button" onClick={onToggleQueue} aria-pressed={isQueueOpen}>
        Queue
      </button>
```

- [ ] **Step 12: Стили панели очереди**

В `src/index.css` добавить:

```css
.queue-panel {
  position: absolute;
  z-index: 18;
  right: 20px;
  bottom: 92px;
  width: min(88vw, 320px);
  max-height: 46vh;
  display: flex;
  flex-direction: column;
  background: rgba(10, 10, 10, 0.82);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 16px;
  color: #f2ede6;
  overflow: hidden;
}

.queue-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.queue-panel__header button {
  appearance: none;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 0.9rem;
}

.queue-panel__list {
  list-style: none;
  margin: 0;
  padding: 6px;
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
  padding: 8px 10px;
  border-radius: 10px;
  font-family: inherit;
  cursor: pointer;
}

.queue-panel__row:hover {
  background: rgba(255, 255, 255, 0.08);
}

.queue-panel__row[aria-current='true'] {
  background: rgba(255, 255, 255, 0.16);
  border-color: rgba(255, 255, 255, 0.3);
}

.queue-panel__artist {
  font-size: 0.78rem;
  color: rgba(242, 237, 230, 0.65);
}
```

- [ ] **Step 13: Исключить панель из свайпов**

В `src/hooks/useSwipeGestures.js` заменить строку с `closest`:

```js
      if (event.target.closest?.('.player-controls, .library-panel, .queue-panel')) return
```

- [ ] **Step 14: Прогнать все тесты и сборку**

Run: `npm test -- --run && npm run build`
Expected: все тесты проходят, сборка успешна.

- [ ] **Step 15: Commit**

```bash
git add src/lib/player/queue.js src/lib/player/queue.test.js src/ui/QueuePanel.jsx src/ui/QueuePanel.test.jsx src/store/usePlayerStore.js src/App.jsx src/ui/PlayerControls.jsx src/index.css src/hooks/useSwipeGestures.js
git commit -m "feat: add play queue with shuffle and repeat modes"
```

---

### Task 11: B4 — Избранное и история в localStorage

**Files:**
- Modify: `src/store/usePlayerStore.js`
- Create: `src/lib/player/history.js`, `src/lib/player/history.test.js`
- Modify: `src/App.jsx`, `src/ui/Library.jsx`, `src/ui/Library.test.jsx`, `src/index.css`

- [ ] **Step 1: Написать падающий тест истории**

Create `src/lib/player/history.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { pushHistoryEntry, toggleFavorite, HISTORY_LIMIT } from './history.js'

describe('pushHistoryEntry', () => {
  it('puts the newest entry first', () => {
    expect(pushHistoryEntry(['b'], 'a')).toEqual(['a', 'b'])
  })

  it('moves a repeated track to the front instead of duplicating it', () => {
    expect(pushHistoryEntry(['a', 'b', 'c'], 'c')).toEqual(['c', 'a', 'b'])
  })

  it('caps the history length', () => {
    const long = Array.from({ length: HISTORY_LIMIT }, (_, i) => `t${i}`)
    const result = pushHistoryEntry(long, 'new')
    expect(result).toHaveLength(HISTORY_LIMIT)
    expect(result[0]).toBe('new')
  })
})

describe('toggleFavorite', () => {
  it('adds a track that is not yet favorited', () => {
    expect(toggleFavorite([], 'a')).toEqual(['a'])
  })

  it('removes a track that is already favorited', () => {
    expect(toggleFavorite(['a', 'b'], 'a')).toEqual(['b'])
  })

  it('does not mutate the input array', () => {
    const input = ['a']
    toggleFavorite(input, 'b')
    expect(input).toEqual(['a'])
  })
})
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npx vitest run src/lib/player/history.test.js`
Expected: FAIL — "Failed to resolve import './history.js'".

- [ ] **Step 3: Реализовать**

Create `src/lib/player/history.js`:

```js
export const HISTORY_LIMIT = 50

export function pushHistoryEntry(history, trackId) {
  const withoutDuplicate = history.filter((id) => id !== trackId)
  return [trackId, ...withoutDuplicate].slice(0, HISTORY_LIMIT)
}

export function toggleFavorite(favorites, trackId) {
  return favorites.includes(trackId)
    ? favorites.filter((id) => id !== trackId)
    : [...favorites, trackId]
}
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npx vitest run src/lib/player/history.test.js`
Expected: PASS (6 тестов).

- [ ] **Step 5: Добавить persist-слой в стор**

Заменить `src/store/usePlayerStore.js` целиком на:

```js
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { pushHistoryEntry, toggleFavorite } from '../lib/player/history.js'

export const usePlayerStore = create(
  persist(
    (set) => ({
      currentArtistId: null,
      currentTrackId: null,
      currentTime: 0,
      isPlaying: false,
      uxMode: 'focus', // 'focus' | 'ambient' | 'utility'
      audioBands: { bass: 0, mid: 0, treble: 0, level: 0 },
      particleVisibleCount: 2000,
      degradationLevel: 0,
      repeatMode: 'off', // 'off' | 'all' | 'one'
      isShuffled: false,
      shuffledOrder: [],
      favorites: [],
      history: [],

      setArtist: (artistId) => set({ currentArtistId: artistId }),
      setTrack: (trackId) => set({ currentTrackId: trackId }),
      setTime: (time) => set({ currentTime: time }),
      setPlaying: (playing) => set({ isPlaying: playing }),
      setUxMode: (mode) => set({ uxMode: mode }),
      setAudioBands: (bands) => set({ audioBands: bands }),
      setParticleVisibleCount: (count) => set({ particleVisibleCount: count }),
      setDegradationLevel: (levelIndex) => set({ degradationLevel: levelIndex }),
      setRepeatMode: (mode) => set({ repeatMode: mode }),
      setShuffle: (isShuffled, shuffledOrder) => set({ isShuffled, shuffledOrder }),
      toggleFavorite: (trackId) => set((state) => ({ favorites: toggleFavorite(state.favorites, trackId) })),
      recordPlay: (trackId) => set((state) => ({ history: pushHistoryEntry(state.history, trackId) })),
    }),
    {
      name: 'matplayer-user-state',
      storage: createJSONStorage(() => localStorage),
      // Сохраняем только пользовательские предпочтения. Всё, что меняется
      // каждый кадр (audioBands, currentTime) или зависит от железа
      // (degradationLevel), в localStorage писать нельзя — это убило бы
      // производительность и восстанавливало бы неверное состояние.
      partialize: (state) => ({
        favorites: state.favorites,
        history: state.history,
        repeatMode: state.repeatMode,
      }),
    },
  ),
)
```

- [ ] **Step 6: Дополнить тест стора**

В `src/store/usePlayerStore.test.js` в объект `defaults` добавить:

```js
  repeatMode: 'off',
  isShuffled: false,
  shuffledOrder: [],
  favorites: [],
  history: [],
```

и добавить тесты перед закрывающей скобкой `describe`:

```js
  it('toggleFavorite adds then removes a track', () => {
    usePlayerStore.getState().toggleFavorite('t1')
    expect(usePlayerStore.getState().favorites).toEqual(['t1'])
    usePlayerStore.getState().toggleFavorite('t1')
    expect(usePlayerStore.getState().favorites).toEqual([])
  })

  it('recordPlay pushes onto history newest-first', () => {
    usePlayerStore.getState().recordPlay('t1')
    usePlayerStore.getState().recordPlay('t2')
    expect(usePlayerStore.getState().history).toEqual(['t2', 't1'])
  })
```

- [ ] **Step 7: Записывать историю при смене трека**

В `src/App.jsx` в эффект перезагрузки аудио добавить строку записи истории:

```jsx
  useEffect(() => {
    const audioEl = audioRef.current
    if (!audioEl) return
    audioEl.load()
    audioEl.play().catch(() => {})
    usePlayerStore.getState().recordPlay(activeTrack.track_id)
  }, [activeTrack.audio_src, activeTrack.track_id])
```

- [ ] **Step 8: Кнопка «в избранное» в строке библиотеки**

В `src/ui/Library.jsx` изменить сигнатуру:

```jsx
export function Library({ entries, activeArtistId, activeTrackId, isOpen, onClose, onSelectTrack, favorites = [], onToggleFavorite }) {
```

и внутри `<li>` после закрывающего `</button>` строки трека добавить:

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

Обернуть содержимое `<li>` во flex-контейнер — заменить `<li key={entry.trackId}>` на `<li key={entry.trackId} className="library-panel__item">`.

- [ ] **Step 9: Добавить тест избранного**

В `src/ui/Library.test.jsx` добавить перед закрывающей скобкой `describe`:

```jsx
  it('shows a filled star for favorited tracks and reports toggles', () => {
    const onToggleFavorite = vi.fn()
    renderLibrary({ favorites: ['cupsize_zppp'], onToggleFavorite })
    expect(screen.getByRole('button', { name: 'Favorite ЗПППП' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Favorite Halo' }))
    expect(onToggleFavorite).toHaveBeenCalledWith('placeholder_b_01')
  })
```

- [ ] **Step 10: Передать избранное из App.jsx**

В рендере `<Library ... />` добавить пропсы:

```jsx
        favorites={favorites}
        onToggleFavorite={(trackId) => usePlayerStore.getState().toggleFavorite(trackId)}
```

и подписку рядом с остальными:

```jsx
  const favorites = usePlayerStore((s) => s.favorites)
```

- [ ] **Step 11: Стили**

В `src/index.css` добавить:

```css
.library-panel__item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.library-panel__fav {
  appearance: none;
  border: none;
  background: transparent;
  color: #f2ede6;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 6px 8px;
  flex-shrink: 0;
}

.library-panel__fav[aria-pressed='true'] {
  color: #ffd257;
}
```

- [ ] **Step 12: Прогнать все тесты и сборку**

Run: `npm test -- --run && npm run build`
Expected: все тесты проходят, сборка успешна.

- [ ] **Step 13: Commit**

```bash
git add src/lib/player/history.js src/lib/player/history.test.js src/store/usePlayerStore.js src/store/usePlayerStore.test.js src/App.jsx src/ui/Library.jsx src/ui/Library.test.jsx src/index.css
git commit -m "feat: persist favorites, history and repeat mode to localStorage"
```

---

### Task 12: B5 — Deep linking с тайм-кодом

**Files:**
- Create: `src/lib/player/deepLink.js`, `src/lib/player/deepLink.test.js`
- Modify: `src/App.jsx`, `src/ui/PlayerControls.jsx`

- [ ] **Step 1: Написать падающий тест**

Create `src/lib/player/deepLink.test.js`:

```js
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
    expect(buildDeepLinkSearch('a', 'b', 0)).not.toContain('t=')
  })
})
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npx vitest run src/lib/player/deepLink.test.js`
Expected: FAIL — "Failed to resolve import './deepLink.js'".

- [ ] **Step 3: Реализовать**

Create `src/lib/player/deepLink.js`:

```js
export function parseDeepLink(search) {
  const params = new URLSearchParams(search)
  const rawTime = params.get('t')
  const parsedTime = rawTime === null ? NaN : Number(rawTime)
  const startTime = Number.isFinite(parsedTime) && parsedTime >= 0 ? parsedTime : null
  return {
    artistId: params.get('artist'),
    trackId: params.get('track'),
    startTime,
  }
}

export function buildDeepLinkSearch(artistId, trackId, startTime) {
  const params = new URLSearchParams({ artist: artistId, track: trackId })
  if (startTime > 0) params.set('t', String(Math.round(startTime * 10) / 10))
  return `?${params.toString()}`
}
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npx vitest run src/lib/player/deepLink.test.js`
Expected: PASS (8 тестов).

- [ ] **Step 5: Применить ссылку при старте**

В `src/App.jsx` добавить импорт:

```jsx
import { parseDeepLink, buildDeepLinkSearch } from './lib/player/deepLink.js'
```

Заменить стартовый эффект выбора артиста на:

```jsx
  // Стартовое состояние: из deep-link, если он валиден, иначе дефолт.
  // Тайм-код применяется отдельно, в обработчике loadedmetadata — до
  // загрузки метаданных установка currentTime молча игнорируется браузером.
  const pendingStartTimeRef = useRef(null)

  useEffect(() => {
    const { artistId, trackId, startTime } = parseDeepLink(window.location.search)
    const artistExists = ARTISTS.some((a) => a.artist_id === artistId)
    const trackExists = Boolean(TRACKS_BY_ID[trackId])
    usePlayerStore.getState().setArtist(artistExists ? artistId : DEFAULT_ARTIST_ID)
    usePlayerStore.getState().setTrack(trackExists ? trackId : DEFAULT_TRACK_ID)
    pendingStartTimeRef.current = trackExists ? startTime : null
  }, [])

  useEffect(() => {
    const audioEl = audioRef.current
    if (!audioEl) return undefined
    const applyStartTime = () => {
      if (pendingStartTimeRef.current !== null) {
        audioEl.currentTime = pendingStartTimeRef.current
        pendingStartTimeRef.current = null
      }
    }
    audioEl.addEventListener('loadedmetadata', applyStartTime)
    return () => audioEl.removeEventListener('loadedmetadata', applyStartTime)
  }, [])
```

- [ ] **Step 6: Кнопка «поделиться»**

В `src/ui/PlayerControls.jsx` добавить в деструктуризацию `onShare` и вставить кнопку перед `Library`:

```jsx
      <button type="button" onClick={onShare} aria-label="Copy link to this moment">
        🔗
      </button>
```

В `src/App.jsx` передать:

```jsx
        onShare={() => {
          const search = buildDeepLinkSearch(
            activeArtist.artist_id,
            activeTrack.track_id,
            audioRef.current?.currentTime ?? 0,
          )
          navigator.clipboard?.writeText(`${window.location.origin}${window.location.pathname}${search}`)
        }}
```

- [ ] **Step 7: Прогнать все тесты и сборку**

Run: `npm test -- --run && npm run build`
Expected: все тесты проходят, сборка успешна.

- [ ] **Step 8: Commit**

```bash
git add src/lib/player/deepLink.js src/lib/player/deepLink.test.js src/App.jsx src/ui/PlayerControls.jsx
git commit -m "feat: support deep links to a specific artist, track and timestamp"
```

---

### Task 13: Проверить Фазу 2 вживую

- [ ] **Step 1: Запушить и дождаться деплоя**

```bash
git push origin master
gh run watch $(gh run list --limit 1 --json databaseId --jq '.[0].databaseId') --exit-status
```

- [ ] **Step 2: Прогнать сценарий через Playwright**

Открыть `https://zazser82-methedron.github.io/MATplayer/?v=phase2`, дождаться готовности, затем через `browser_evaluate` проверить:
- слайдер громкости меняет `audio.volume` нелинейно (при UI 0.5 → volume ≈ 0.125);
- кнопка shuffle меняет `aria-pressed`;
- кнопка repeat циклится off → all → one;
- звёздочка в библиотеке сохраняется после перезагрузки страницы (localStorage).

- [ ] **Step 3: Проверить deep link**

Открыть `https://zazser82-methedron.github.io/MATplayer/?artist=cupsize&track=cupsize_t01_knives&t=30` и убедиться, что играет Knives и `audio.currentTime >= 29`.

- [ ] **Step 4: Проверить консоль**

Ожидается только `favicon.ico` 404.

---

# ФАЗА 3 — Аудио-движок (C1, C2, B3)

### Task 14: C1 — Заменить линейный кроссфейд на equal-power

**Контекст:** текущая формула (`1-t`, `t`) даёт провал суммарной мощности примерно на 3 дБ в середине перехода. Тест на неё тоже нужно переписать — он сейчас фиксирует именно линейное поведение (`0.5/0.5` в середине).

**Files:**
- Modify: `src/lib/audio/crossfade.js`, `src/lib/audio/crossfade.test.js`

- [ ] **Step 1: Переписать тест под equal-power**

Заменить `src/lib/audio/crossfade.test.js` целиком на:

```js
import { describe, it, expect } from 'vitest'
import { computeCrossfadeGains } from './crossfade.js'

describe('computeCrossfadeGains', () => {
  it('is fully outgoing at progress=0', () => {
    const { outgoingGain, incomingGain } = computeCrossfadeGains(0)
    expect(outgoingGain).toBeCloseTo(1, 5)
    expect(incomingGain).toBeCloseTo(0, 5)
  })

  it('is fully incoming at progress=1', () => {
    const { outgoingGain, incomingGain } = computeCrossfadeGains(1)
    expect(outgoingGain).toBeCloseTo(0, 5)
    expect(incomingGain).toBeCloseTo(1, 5)
  })

  it('holds constant total power across the whole fade', () => {
    // Equal-power: сумма квадратов усилений равна 1 в любой точке перехода.
    // Линейный кроссфейд здесь дал бы 0.5 в середине — слышимый провал.
    for (let p = 0; p <= 1.0001; p += 0.1) {
      const { outgoingGain, incomingGain } = computeCrossfadeGains(p)
      expect(outgoingGain ** 2 + incomingGain ** 2).toBeCloseTo(1, 5)
    }
  })

  it('is symmetric at the midpoint', () => {
    const { outgoingGain, incomingGain } = computeCrossfadeGains(0.5)
    expect(outgoingGain).toBeCloseTo(Math.SQRT1_2, 5)
    expect(incomingGain).toBeCloseTo(Math.SQRT1_2, 5)
  })

  it('clamps progress below 0', () => {
    const { outgoingGain, incomingGain } = computeCrossfadeGains(-0.3)
    expect(outgoingGain).toBeCloseTo(1, 5)
    expect(incomingGain).toBeCloseTo(0, 5)
  })

  it('clamps progress above 1', () => {
    const { outgoingGain, incomingGain } = computeCrossfadeGains(1.3)
    expect(outgoingGain).toBeCloseTo(0, 5)
    expect(incomingGain).toBeCloseTo(1, 5)
  })
})
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npx vitest run src/lib/audio/crossfade.test.js`
Expected: FAIL — "holds constant total power" получает 0.5 вместо 1 в середине.

- [ ] **Step 3: Заменить формулу**

Заменить `src/lib/audio/crossfade.js` целиком на:

```js
// Equal-power кроссфейд. Линейное сведение (1-t, t) даёт провал суммарной
// мощности примерно на 3 дБ в середине перехода — на слух это «дырка».
// Синус/косинус держат сумму квадратов усилений равной единице всюду.
export function computeCrossfadeGains(progress) {
  const t = Math.min(1, Math.max(0, progress))
  return {
    outgoingGain: Math.cos((t * Math.PI) / 2),
    incomingGain: Math.sin((t * Math.PI) / 2),
  }
}
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npx vitest run src/lib/audio/crossfade.test.js`
Expected: PASS (6 тестов).

- [ ] **Step 5: Прогнать все тесты**

Run: `npm test -- --run`
Expected: все тесты проходят.

- [ ] **Step 6: Commit**

```bash
git add src/lib/audio/crossfade.js src/lib/audio/crossfade.test.js
git commit -m "fix: crossfade was linear, dipping ~3dB mid-transition; use equal-power"
```

---

### Task 15: Загрузка и декодирование AudioBuffer (общий шаг для C2 и B3)

**Контекст:** и BPM-детектор, и построение waveform требуют `AudioBuffer`. Воспроизведение остаётся на `<audio>` (нативный стриминг не теряем) — decodeAudioData используется только для анализа, поэтому файл скачивается вторично. Это осознанный размен: полный переход на `AudioBufferSourceNode` потребовал бы переписать весь движок воспроизведения и убил бы прогрессивное воспроизведение длинных треков.

**Files:**
- Create: `src/lib/audio/loadAudioBuffer.js`

- [ ] **Step 1: Реализовать загрузчик с кешем**

Create `src/lib/audio/loadAudioBuffer.js`:

```js
// Кеш живёт на уровне модуля: один и тот же трек анализируется один раз
// за сессию, даже если пользователь возвращается к нему несколько раз.
const bufferCache = new Map()

export async function loadAudioBuffer(url, audioContext) {
  if (bufferCache.has(url)) return bufferCache.get(url)

  const promise = (async () => {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to fetch audio for analysis: ${response.status} ${url}`)
    const arrayBuffer = await response.arrayBuffer()
    return audioContext.decodeAudioData(arrayBuffer)
  })()

  // Кешируем сам промис, а не результат: два одновременных запроса на один
  // трек не должны приводить к двум загрузкам.
  bufferCache.set(url, promise)
  try {
    return await promise
  } catch (error) {
    bufferCache.delete(url)
    throw error
  }
}

export function clearAudioBufferCache() {
  bufferCache.clear()
}
```

- [ ] **Step 2: Прогнать тесты и сборку**

Run: `npm test -- --run && npm run build`
Expected: все тесты проходят, сборка успешна.

- [ ] **Step 3: Commit**

```bash
git add src/lib/audio/loadAudioBuffer.js
git commit -m "feat: add cached fetch+decode step that unlocks BPM and waveform analysis"
```

---

### Task 16: C2 — BPM-синхронные импульсы

**Files:**
- Create: `src/lib/audio/beatPulse.js`, `src/lib/audio/beatPulse.test.js`
- Modify: `src/store/usePlayerStore.js`, `src/hooks/useAudioAnalyser.js`
- Modify: `src/three/AvatarProxy.jsx`, `src/three/Atlas.jsx`, `src/App.jsx`

- [ ] **Step 1: Написать падающий тест**

Create `src/lib/audio/beatPulse.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { computeBeatPhase, computeBeatPulse } from './beatPulse.js'

describe('computeBeatPhase', () => {
  it('is 0 exactly on a beat', () => {
    // 120 BPM = 2 доли в секунду, значит доли на 0, 0.5, 1.0 с
    expect(computeBeatPhase(0, 120)).toBeCloseTo(0, 5)
    expect(computeBeatPhase(0.5, 120)).toBeCloseTo(0, 5)
    expect(computeBeatPhase(1.0, 120)).toBeCloseTo(0, 5)
  })

  it('is 0.5 exactly between two beats', () => {
    expect(computeBeatPhase(0.25, 120)).toBeCloseTo(0.5, 5)
  })

  it('stays within 0..1', () => {
    for (const t of [0.1, 3.7, 42.42]) {
      const phase = computeBeatPhase(t, 135)
      expect(phase).toBeGreaterThanOrEqual(0)
      expect(phase).toBeLessThan(1)
    }
  })

  it('returns 0 for a missing or invalid BPM', () => {
    expect(computeBeatPhase(1.3, null)).toBe(0)
    expect(computeBeatPhase(1.3, 0)).toBe(0)
  })
})

describe('computeBeatPulse', () => {
  it('peaks at 1 on the beat', () => {
    expect(computeBeatPulse(0, 120)).toBeCloseTo(1, 5)
  })

  it('decays to near zero before the next beat', () => {
    expect(computeBeatPulse(0.45, 120)).toBeLessThan(0.05)
  })

  it('decays monotonically between beats', () => {
    let previous = Infinity
    for (let t = 0; t < 0.5; t += 0.05) {
      const pulse = computeBeatPulse(t, 120)
      expect(pulse).toBeLessThanOrEqual(previous + 1e-9)
      previous = pulse
    }
  })

  it('is flat at zero when BPM is unknown', () => {
    expect(computeBeatPulse(1.3, null)).toBe(0)
  })
})
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npx vitest run src/lib/audio/beatPulse.test.js`
Expected: FAIL — "Failed to resolve import './beatPulse.js'".

- [ ] **Step 3: Реализовать**

Create `src/lib/audio/beatPulse.js`:

```js
// Доля пути от предыдущей доли к следующей: 0 ровно на доле, →1 перед следующей.
export function computeBeatPhase(currentTime, bpm) {
  if (!bpm || bpm <= 0) return 0
  const beatsElapsed = (currentTime * bpm) / 60
  return beatsElapsed - Math.floor(beatsElapsed)
}

// Резкая атака на доле с быстрым спадом. Четвёртая степень выбрана
// эмпирически: спад достаточно быстрый, чтобы удар читался отдельным
// импульсом, а не размазывался в непрерывное покачивание.
export function computeBeatPulse(currentTime, bpm) {
  if (!bpm || bpm <= 0) return 0
  return Math.pow(1 - computeBeatPhase(currentTime, bpm), 4)
}
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npx vitest run src/lib/audio/beatPulse.test.js`
Expected: PASS (8 тестов).

- [ ] **Step 5: Хранить обнаруженный BPM в сторе**

В `src/store/usePlayerStore.js` добавить поле после `degradationLevel: 0,`:

```js
      detectedBpm: null,
```

и сеттер:

```js
      setDetectedBpm: (bpm) => set({ detectedBpm: bpm }),
```

- [ ] **Step 6: Запускать детект BPM при смене трека**

В `src/App.jsx` добавить импорты:

```jsx
import { loadAudioBuffer } from './lib/audio/loadAudioBuffer.js'
import { detectBpm } from './lib/audio/beatDetector.js'
```

Добавить эффект после эффекта перезагрузки аудио:

```jsx
  // BPM считается по отдельно скачанному и декодированному файлу: движок
  // воспроизведения работает через <audio> и AudioBuffer не даёт. Анализ
  // асинхронный и необязательный — если он не удался, визуал просто
  // остаётся без BPM-пульсаций, воспроизведение это не ломает.
  const audioSrc = `${import.meta.env.BASE_URL}audio/${activeTrack.audio_src}`
  useEffect(() => {
    let cancelled = false
    usePlayerStore.getState().setDetectedBpm(activeTrack.tempo_bpm ?? null)

    const audioEl = audioRef.current
    const context = audioEl?.__matplayerContext
    if (!context) return undefined

    loadAudioBuffer(audioSrc, context)
      .then((buffer) => detectBpm(buffer))
      .then((bpm) => {
        if (!cancelled) usePlayerStore.getState().setDetectedBpm(bpm)
      })
      .catch(() => {
        // Профильный tempo_bpm уже выставлен выше — этого достаточно.
      })

    return () => {
      cancelled = true
    }
  }, [audioSrc, activeTrack.tempo_bpm])
```

- [ ] **Step 7: Открыть AudioContext для переиспользования**

В `src/hooks/useAudioAnalyser.js` после создания движка добавить строку, чтобы контекст был доступен эффекту выше (иначе пришлось бы создавать второй `AudioContext`, а браузеры ограничивают их количество):

```js
    const engine = new AudioEngine(audioEl)
    audioEl.__matplayerContext = engine.context
    engineRef.current = engine
```

и в функции очистки:

```js
    return () => {
      cancelAnimationFrame(rafId)
      delete audioEl.__matplayerContext
      engine.dispose()
      engineRef.current = null
    }
```

- [ ] **Step 8: Пульсация аватара на долю**

В `src/three/AvatarProxy.jsx` добавить импорты:

```jsx
import { usePlayerStore } from '../store/usePlayerStore.js'
import { computeBeatPulse } from '../lib/audio/beatPulse.js'
```

Заменить тело `useFrame` на:

```jsx
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const breath = computeBreathScale(t, energy)
    const blink = computeBlinkScale(t)
    // Транзиентное чтение: currentTime и detectedBpm меняются каждый кадр,
    // подписка через хук вызывала бы ре-рендер React на 60 fps.
    const { currentTime, detectedBpm } = usePlayerStore.getState()
    const pulse = computeBeatPulse(currentTime, detectedBpm) * 0.06
    if (breathGroupRef.current) {
      breathGroupRef.current.scale.set(1 + pulse, breath + pulse, 1 + pulse)
    }
    if (leftEyeRef.current) leftEyeRef.current.scale.y = blink
    if (rightEyeRef.current) rightEyeRef.current.scale.y = blink
  })
```

- [ ] **Step 9: Прогнать все тесты и сборку**

Run: `npm test -- --run && npm run build`
Expected: все тесты проходят, сборка успешна.

- [ ] **Step 10: Commit**

```bash
git add src/lib/audio/beatPulse.js src/lib/audio/beatPulse.test.js src/store/usePlayerStore.js src/hooks/useAudioAnalyser.js src/three/AvatarProxy.jsx src/App.jsx
git commit -m "feat: pulse the avatar on detected beats"
```

---

### Task 17: B3 — Seek-бар с waveform

**Files:**
- Create: `src/lib/audio/waveform.js`, `src/lib/audio/waveform.test.js`
- Create: `src/ui/SeekBar.jsx`, `src/ui/SeekBar.test.jsx`
- Modify: `src/App.jsx`, `src/index.css`

- [ ] **Step 1: Написать падающий тест**

Create `src/lib/audio/waveform.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { computeWaveformPeaks } from './waveform.js'

describe('computeWaveformPeaks', () => {
  it('returns exactly the requested number of buckets', () => {
    const samples = new Float32Array(1000).fill(0.5)
    expect(computeWaveformPeaks(samples, 100)).toHaveLength(100)
  })

  it('captures the peak amplitude of each bucket', () => {
    const samples = new Float32Array([0, 0.2, 0, 0.9])
    expect(computeWaveformPeaks(samples, 2)).toEqual([0.2, 0.9])
  })

  it('treats negative swings as equal in magnitude to positive ones', () => {
    const samples = new Float32Array([-0.8, 0.1])
    expect(computeWaveformPeaks(samples, 1)).toEqual([0.8])
  })

  it('returns zeros when there are no samples', () => {
    expect(computeWaveformPeaks(new Float32Array(0), 3)).toEqual([0, 0, 0])
  })

  it('handles fewer samples than buckets without producing NaN', () => {
    const peaks = computeWaveformPeaks(new Float32Array([0.5, 0.7]), 5)
    expect(peaks).toHaveLength(5)
    expect(peaks.every((p) => Number.isFinite(p))).toBe(true)
  })
})
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npx vitest run src/lib/audio/waveform.test.js`
Expected: FAIL — "Failed to resolve import './waveform.js'".

- [ ] **Step 3: Реализовать**

Create `src/lib/audio/waveform.js`:

```js
// Даунсэмплинг PCM до фиксированного числа столбиков. Берём именно пик, а
// не среднее: среднее по громкому участку стремится к нулю из-за
// знакопеременности сигнала и рисует плоскую линию вместо формы волны.
export function computeWaveformPeaks(channelData, bucketCount) {
  const peaks = new Array(bucketCount).fill(0)
  if (channelData.length === 0) return peaks

  const samplesPerBucket = channelData.length / bucketCount
  for (let bucket = 0; bucket < bucketCount; bucket++) {
    const start = Math.floor(bucket * samplesPerBucket)
    const end = Math.min(channelData.length, Math.max(start + 1, Math.floor((bucket + 1) * samplesPerBucket)))
    let peak = 0
    for (let i = start; i < end; i++) {
      const magnitude = Math.abs(channelData[i])
      if (magnitude > peak) peak = magnitude
    }
    peaks[bucket] = peak
  }
  return peaks
}
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npx vitest run src/lib/audio/waveform.test.js`
Expected: PASS (5 тестов).

- [ ] **Step 5: Написать падающий тест компонента**

Create `src/ui/SeekBar.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SeekBar } from './SeekBar.jsx'

describe('SeekBar', () => {
  it('exposes progress through an accessible slider', () => {
    render(<SeekBar currentTime={30} duration={120} peaks={[]} onSeek={() => {}} />)
    const slider = screen.getByRole('slider', { name: 'Seek' })
    expect(slider).toHaveAttribute('aria-valuenow', '30')
    expect(slider).toHaveAttribute('aria-valuemax', '120')
  })

  it('reports the seeked time', () => {
    const onSeek = vi.fn()
    render(<SeekBar currentTime={30} duration={120} peaks={[]} onSeek={onSeek} />)
    fireEvent.change(screen.getByRole('slider', { name: 'Seek' }), { target: { value: '75' } })
    expect(onSeek).toHaveBeenCalledWith(75)
  })

  it('renders readable timestamps', () => {
    render(<SeekBar currentTime={65} duration={125} peaks={[]} onSeek={() => {}} />)
    expect(screen.getByText('1:05')).toBeInTheDocument()
    expect(screen.getByText('2:05')).toBeInTheDocument()
  })

  it('survives a zero duration before metadata loads', () => {
    render(<SeekBar currentTime={0} duration={0} peaks={[]} onSeek={() => {}} />)
    expect(screen.getByRole('slider', { name: 'Seek' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Запустить тест — убедиться, что падает**

Run: `npx vitest run src/ui/SeekBar.test.jsx`
Expected: FAIL — "Failed to resolve import './SeekBar.jsx'".

- [ ] **Step 7: Реализовать компонент**

Create `src/ui/SeekBar.jsx`:

```jsx
export function formatTimestamp(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const minutes = Math.floor(total / 60)
  return `${minutes}:${String(total % 60).padStart(2, '0')}`
}

export function SeekBar({ currentTime, duration, peaks, onSeek }) {
  const safeDuration = duration > 0 ? duration : 0
  const progress = safeDuration > 0 ? currentTime / safeDuration : 0

  return (
    <div className="seek-bar">
      <span className="seek-bar__time">{formatTimestamp(currentTime)}</span>
      <span className="seek-bar__track">
        <span className="seek-bar__peaks" aria-hidden="true">
          {peaks.map((peak, index) => (
            <span
              key={index}
              className="seek-bar__peak"
              data-played={index / Math.max(1, peaks.length) <= progress ? 'true' : undefined}
              style={{ height: `${Math.max(6, peak * 100)}%` }}
            />
          ))}
        </span>
        <input
          type="range"
          className="seek-bar__input"
          min="0"
          max={safeDuration || 1}
          step="0.1"
          value={Math.min(currentTime, safeDuration || 1)}
          onChange={(event) => onSeek(Number(event.target.value))}
          aria-label="Seek"
          aria-valuenow={Math.round(currentTime)}
          aria-valuemin={0}
          aria-valuemax={Math.round(safeDuration)}
        />
      </span>
      <span className="seek-bar__time">{formatTimestamp(safeDuration)}</span>
    </div>
  )
}
```

- [ ] **Step 8: Запустить тест — убедиться, что проходит**

Run: `npx vitest run src/ui/SeekBar.test.jsx`
Expected: PASS (4 теста).

- [ ] **Step 9: Подключить в App.jsx**

Добавить импорты:

```jsx
import { SeekBar } from './ui/SeekBar.jsx'
import { computeWaveformPeaks } from './lib/audio/waveform.js'
```

Добавить состояние:

```jsx
  const [peaks, setPeaks] = useState([])
  const [duration, setDuration] = useState(0)
  const currentTime = usePlayerStore((s) => s.currentTime)
```

Расширить существующий эффект детекта BPM, чтобы он заодно строил waveform (buffer уже декодирован и закеширован — второй загрузки не будет). Заменить его цепочку `.then` на:

```jsx
    loadAudioBuffer(audioSrc, context)
      .then((buffer) => {
        if (!cancelled) setPeaks(computeWaveformPeaks(buffer.getChannelData(0), 160))
        return detectBpm(buffer)
      })
      .then((bpm) => {
        if (!cancelled) usePlayerStore.getState().setDetectedBpm(bpm)
      })
      .catch(() => {
        // Профильный tempo_bpm уже выставлен выше — этого достаточно.
      })
```

и добавить сброс пиков в начало эффекта (рядом с `setDetectedBpm`):

```jsx
    setPeaks([])
```

Добавить эффект чтения длительности:

```jsx
  useEffect(() => {
    const audioEl = audioRef.current
    if (!audioEl) return undefined
    const readDuration = () => setDuration(audioEl.duration || 0)
    audioEl.addEventListener('loadedmetadata', readDuration)
    return () => audioEl.removeEventListener('loadedmetadata', readDuration)
  }, [])
```

Отрендерить перед `<PlayerControls ... />`:

```jsx
      {usePlayerStore.getState().uxMode === 'utility' && (
        <SeekBar
          currentTime={currentTime}
          duration={duration}
          peaks={peaks}
          onSeek={(time) => {
            if (audioRef.current) audioRef.current.currentTime = time
          }}
        />
      )}
```

Заменить это на реактивную подписку, чтобы бар появлялся/исчезал вместе с контролами — добавить рядом с остальными подписками:

```jsx
  const uxMode = usePlayerStore((s) => s.uxMode)
```

и использовать `{uxMode === 'utility' && (` вместо `usePlayerStore.getState().uxMode`.

- [ ] **Step 10: Стили**

В `src/index.css` добавить:

```css
.seek-bar {
  position: absolute;
  z-index: 9;
  left: 50%;
  bottom: 92px;
  transform: translateX(-50%);
  width: min(92vw, 560px);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: rgba(10, 10, 10, 0.55);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  color: #f2ede6;
  font-variant-numeric: tabular-nums;
  font-size: 0.78rem;
}

.seek-bar__track {
  position: relative;
  flex: 1;
  height: 34px;
  display: block;
}

.seek-bar__peaks {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  gap: 1px;
  pointer-events: none;
}

.seek-bar__peak {
  flex: 1;
  background: rgba(255, 255, 255, 0.22);
  border-radius: 1px;
  min-height: 2px;
}

.seek-bar__peak[data-played='true'] {
  background: rgba(255, 255, 255, 0.75);
}

.seek-bar__input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}
```

- [ ] **Step 11: Исключить seek-бар из свайпов**

В `src/hooks/useSwipeGestures.js`:

```js
      if (event.target.closest?.('.player-controls, .library-panel, .queue-panel, .seek-bar')) return
```

- [ ] **Step 12: Прогнать все тесты и сборку**

Run: `npm test -- --run && npm run build`
Expected: все тесты проходят, сборка успешна.

- [ ] **Step 13: Commit**

```bash
git add src/lib/audio/waveform.js src/lib/audio/waveform.test.js src/ui/SeekBar.jsx src/ui/SeekBar.test.jsx src/App.jsx src/index.css src/hooks/useSwipeGestures.js
git commit -m "feat: add waveform seek bar backed by decoded PCM peaks"
```

---

### Task 18: Проверить Фазу 3 вживую

- [ ] **Step 1: Запушить и дождаться деплоя**

```bash
git push origin master
gh run watch $(gh run list --limit 1 --json databaseId --jq '.[0].databaseId') --exit-status
```

- [ ] **Step 2: Проверить waveform и BPM через Playwright**

Открыть `https://zazser82-methedron.github.io/MATplayer/?v=phase3`. Дождаться готовности, подождать ~5 с (декодирование), затем `browser_evaluate` проверить:
- `document.querySelectorAll('.seek-bar__peak').length === 160` — waveform построен;
- в сторе `detectedBpm` — число, а не null.

- [ ] **Step 3: Проверить консоль**

Ожидается только `favicon.ico` 404. Ошибки CORS при `fetch` mp3 — блокирующие: значит, файлы отдаются с заголовками, не допускающими чтение. Тогда добавить `crossOrigin` на fetch или отказаться от анализа для внешних источников.

---

# ФАЗА 4 — Контент и экран артиста (C5, B6)

### Task 19: C5 — Импортировать 26 треков ЗМП

**Контекст:** в `public/audio/cupsize/` лежат только `01.mp3`, `10.mp3`, `24.mp3`. Остальные 23 — в `C:\Users\exxck\Projects\games\cupsize-v2-story\audio\`. Все 26 весят 174 МБ. Названия и авторские теги настроения берутся из массива `TRACKS` в `cupsize-v2-story/main.js` — они точнее любой автогенерации.

**ВНИМАНИЕ:** копирование 174 МБ бинарников в git-репозиторий делает каждый клон и каждый деплой тяжёлым. Это в пределах лимитов GitHub (блокируются только файлы >100 МБ, предупреждение — от 1 ГБ), но перед выполнением этой задачи сообщить пользователю размер и подтвердить.

**Files:**
- Create: `scripts/import-cupsize-tracks.mjs`
- Create: `src/data/tracks/cupsize/*.json` (23 новых)
- Modify: `src/data/artists/cupsize.json`
- Copy: 23 mp3 в `public/audio/cupsize/`

- [ ] **Step 1: Подтвердить размер с пользователем**

Сообщить: «Копирование всех 26 треков ЗМП добавит в репозиторий 174 МБ mp3. Клоны и деплои станут заметно тяжелее. Продолжать?» Дождаться ответа.

- [ ] **Step 2: Написать скрипт импорта**

Create `scripts/import-cupsize-tracks.mjs`:

```js
// Генерирует профили треков ЗМП из авторского списка в cupsize-v2-story.
// Названия и настроения взяты оттуда вручную — они точнее, чем всё, что
// можно вывести автоматически из аудио.
import { writeFileSync, copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE_AUDIO_DIR = 'C:/Users/exxck/Projects/games/cupsize-v2-story/audio'
const TARGET_AUDIO_DIR = join(projectRoot, 'public/audio/cupsize')
const TARGET_PROFILE_DIR = join(projectRoot, 'src/data/tracks/cupsize')

// n, title, mood — дословно из TRACKS в cupsize-v2-story/main.js
const TRACKS = [
  { n: 1, title: 'Семнадцать ножевых', mood: 'злой' },
  { n: 2, title: 'Детская травма', mood: 'страшный' },
  { n: 3, title: 'Вся моя жизнь говно', mood: 'злой' },
  { n: 4, title: 'Будка', mood: 'грустный' },
  { n: 5, title: 'Розовая могила', mood: 'мрачный' },
  { n: 6, title: 'Следак', mood: 'напряжённый' },
  { n: 7, title: 'Черновик', mood: 'задумчивый' },
  { n: 8, title: 'Ты уебалась головой', mood: 'злой' },
  { n: 9, title: 'Первокурсница', mood: 'грустный' },
  { n: 10, title: 'ЗППП', mood: 'горький' },
  { n: 11, title: 'Станцуй со мной', mood: 'нежный' },
  { n: 12, title: 'Верёвка', mood: 'тёмный' },
  { n: 13, title: 'Я без ума от тебя', mood: 'нежный' },
  { n: 14, title: 'Север', mood: 'холодный' },
  { n: 15, title: 'Вата', mood: 'мягкий' },
  { n: 16, title: 'Напорносайтах', mood: 'горький' },
  { n: 17, title: 'По барабану', mood: 'злой' },
  { n: 18, title: 'Велосипед', mood: 'нежный' },
  { n: 19, title: 'Малолетки', mood: 'ностальгия' },
  { n: 20, title: 'Урод', mood: 'горький' },
  { n: 21, title: 'Сигареты', mood: 'ностальгия' },
  { n: 22, title: 'Неудобно', mood: 'грустный' },
  { n: 23, title: 'Тетрадь', mood: 'задумчивый' },
  { n: 24, title: 'Ванна, красный пол', mood: 'тёмный' },
  { n: 25, title: 'Все мои поступки', mood: 'хаос' },
  { n: 26, title: 'Прыгай, дура!', mood: 'надежда' },
]

// Русский авторский тег → наша таксономия + визуальный пресет.
// Префикс melancholic_ включает God Rays (Atlas проверяет startsWith).
const MOOD_PRESETS = {
  злой: {
    mood: 'aggressive_grunge',
    tempo_bpm: 132,
    energy: 0.88,
    color_palette: { background: '#0d0101', primary: '#ff0055', secondary: '#39ff14' },
    shader_presets: { noise_type: 'turbulent_glitch', outline_thickness: 0.06, bloom_intensity: 1.4 },
  },
  страшный: {
    mood: 'aggressive_industrial',
    tempo_bpm: 120,
    energy: 0.75,
    color_palette: { background: '#050408', primary: '#7a00cc', secondary: '#00ffcc' },
    shader_presets: { noise_type: 'turbulent_glitch', outline_thickness: 0.07, bloom_intensity: 1.6 },
  },
  напряжённый: {
    mood: 'aggressive_tense',
    tempo_bpm: 126,
    energy: 0.8,
    color_palette: { background: '#0a0a0d', primary: '#ff6600', secondary: '#ffcc00' },
    shader_presets: { noise_type: 'turbulent_glitch', outline_thickness: 0.05, bloom_intensity: 1.3 },
  },
  хаос: {
    mood: 'aggressive_chaos',
    tempo_bpm: 145,
    energy: 0.95,
    color_palette: { background: '#0d0008', primary: '#ff00aa', secondary: '#00e5ff' },
    shader_presets: { noise_type: 'turbulent_glitch', outline_thickness: 0.08, bloom_intensity: 1.8 },
  },
  грустный: {
    mood: 'melancholic_sad',
    tempo_bpm: 88,
    energy: 0.28,
    color_palette: { background: '#0f1420', primary: '#7f9dc4', secondary: '#d8e4f0' },
    shader_presets: { noise_type: 'laminar', outline_thickness: 0.02, bloom_intensity: 0.7 },
  },
  мрачный: {
    mood: 'melancholic_grim',
    tempo_bpm: 76,
    energy: 0.22,
    color_palette: { background: '#100a12', primary: '#a05a80', secondary: '#e0c0d0' },
    shader_presets: { noise_type: 'laminar', outline_thickness: 0.03, bloom_intensity: 0.8 },
  },
  задумчивый: {
    mood: 'melancholic_pensive',
    tempo_bpm: 84,
    energy: 0.25,
    color_palette: { background: '#0e1216', primary: '#8fa3ad', secondary: '#e8eef2' },
    shader_presets: { noise_type: 'laminar', outline_thickness: 0.02, bloom_intensity: 0.6 },
  },
  горький: {
    mood: 'melancholic_bitter',
    tempo_bpm: 96,
    energy: 0.4,
    color_palette: { background: '#120d0d', primary: '#c47a6a', secondary: '#f0ddd4' },
    shader_presets: { noise_type: 'laminar', outline_thickness: 0.03, bloom_intensity: 0.9 },
  },
  нежный: {
    mood: 'melancholic_tender',
    tempo_bpm: 92,
    energy: 0.3,
    color_palette: { background: '#1a0f14', primary: '#e8b4c8', secondary: '#f2ede6' },
    shader_presets: { noise_type: 'laminar', outline_thickness: 0.02, bloom_intensity: 0.7 },
  },
  тёмный: {
    mood: 'melancholic_dark',
    tempo_bpm: 80,
    energy: 0.24,
    color_palette: { background: '#08090c', primary: '#5a6a80', secondary: '#c0ccd8' },
    shader_presets: { noise_type: 'laminar', outline_thickness: 0.03, bloom_intensity: 0.8 },
  },
  холодный: {
    mood: 'melancholic_cold',
    tempo_bpm: 82,
    energy: 0.26,
    color_palette: { background: '#0a1014', primary: '#6fb0c4', secondary: '#dff0f5' },
    shader_presets: { noise_type: 'laminar', outline_thickness: 0.02, bloom_intensity: 0.9 },
  },
  мягкий: {
    mood: 'melancholic_soft',
    tempo_bpm: 86,
    energy: 0.2,
    color_palette: { background: '#141014', primary: '#c8b4d8', secondary: '#f0eaf5' },
    shader_presets: { noise_type: 'laminar', outline_thickness: 0.015, bloom_intensity: 0.6 },
  },
  ностальгия: {
    mood: 'melancholic_nostalgic',
    tempo_bpm: 98,
    energy: 0.42,
    color_palette: { background: '#14100a', primary: '#d4a76a', secondary: '#f5ead4' },
    shader_presets: { noise_type: 'laminar', outline_thickness: 0.025, bloom_intensity: 1.0 },
  },
  надежда: {
    mood: 'melancholic_hopeful',
    tempo_bpm: 104,
    energy: 0.5,
    color_palette: { background: '#0c1410', primary: '#7fd4a0', secondary: '#eaf5ee' },
    shader_presets: { noise_type: 'laminar', outline_thickness: 0.02, bloom_intensity: 1.1 },
  },
}

function trackIdFor(n) {
  return `cupsize_t${String(n).padStart(2, '0')}`
}

mkdirSync(TARGET_AUDIO_DIR, { recursive: true })
mkdirSync(TARGET_PROFILE_DIR, { recursive: true })

const trackIds = []
for (const { n, title, mood } of TRACKS) {
  const preset = MOOD_PRESETS[mood]
  if (!preset) throw new Error(`No preset mapped for mood "${mood}" (track ${n})`)

  const padded = String(n).padStart(2, '0')
  const sourceAudio = join(SOURCE_AUDIO_DIR, `${padded}.mp3`)
  const targetAudio = join(TARGET_AUDIO_DIR, `${padded}.mp3`)
  if (!existsSync(sourceAudio)) throw new Error(`Missing source audio: ${sourceAudio}`)
  if (!existsSync(targetAudio)) copyFileSync(sourceAudio, targetAudio)

  const trackId = trackIdFor(n)
  trackIds.push(trackId)

  const profile = {
    track_id: trackId,
    title,
    tempo_bpm: preset.tempo_bpm,
    energy: preset.energy,
    mood: preset.mood,
    color_palette: preset.color_palette,
    shader_presets: preset.shader_presets,
    lyrics_ref: `cupsize/track-${padded}.json`,
    audio_src: `cupsize/${padded}.mp3`,
  }
  writeFileSync(join(TARGET_PROFILE_DIR, `${trackId}.json`), `${JSON.stringify(profile, null, 2)}\n`, 'utf8')
}

const artistPath = join(projectRoot, 'src/data/artists/cupsize.json')
const artist = JSON.parse(readFileSync(artistPath, 'utf8'))
artist.track_ids = trackIds
writeFileSync(artistPath, `${JSON.stringify(artist, null, 2)}\n`, 'utf8')

console.log(`Imported ${trackIds.length} Cupsize tracks.`)
```

- [ ] **Step 3: Удалить три старых профиля с прежними именами**

```bash
git rm src/data/tracks/cupsize/cupsize_t01_knives.json src/data/tracks/cupsize/cupsize_zppp.json src/data/tracks/cupsize/cupsize_t24_flowers.json
```

- [ ] **Step 4: Обновить дефолтный трек в App.jsx**

В `src/App.jsx` заменить константу:

```jsx
const DEFAULT_TRACK_ID = 'cupsize_t10'
```

- [ ] **Step 5: Запустить скрипт**

Run: `node scripts/import-cupsize-tracks.mjs`
Expected: `Imported 26 Cupsize tracks.`

- [ ] **Step 6: Починить тесты, ссылающиеся на старые track_id**

В `src/data/contentData.test.js` и `src/data/lyricsResolution.test.js` заменить прямые импорты трёх старых файлов на использование агрегатора. Заменить `src/data/contentData.test.js` целиком на:

```js
import { describe, it, expect } from 'vitest'
import { parseArtistProfile } from '../lib/schema/artistSchema.js'
import { parseTrackProfile } from '../lib/schema/trackSchema.js'
import { ARTISTS, TRACKS_BY_ID } from './index.js'

describe('content data', () => {
  it('validates all artist profiles', () => {
    for (const artist of ARTISTS) {
      expect(() => parseArtistProfile(artist)).not.toThrow()
    }
  })

  it('validates all track profiles', () => {
    for (const track of Object.values(TRACKS_BY_ID)) {
      expect(() => parseTrackProfile(track)).not.toThrow()
    }
  })

  it('every artist track_ids entry has a matching track profile', () => {
    for (const artist of ARTISTS) {
      for (const trackId of artist.track_ids) {
        expect(TRACKS_BY_ID[trackId], `missing track profile for ${trackId}`).toBeDefined()
      }
    }
  })

  it('ships the full Cupsize album', () => {
    const cupsize = ARTISTS.find((a) => a.artist_id === 'cupsize')
    expect(cupsize.track_ids).toHaveLength(26)
  })

  it('covers both aggressive and melancholic moods', () => {
    const moods = Object.values(TRACKS_BY_ID).map((t) => t.mood)
    expect(moods.some((m) => m.startsWith('aggressive'))).toBe(true)
    expect(moods.some((m) => m.startsWith('melancholic'))).toBe(true)
  })
})
```

Заменить `src/data/lyricsResolution.test.js` целиком на:

```js
import { describe, it, expect } from 'vitest'
import { parseLyrics } from '../lib/lyrics/lyricsParser.js'
import { TRACKS_BY_ID, resolveLyrics } from './index.js'

describe('lyrics_ref resolution', () => {
  it('resolves and parses the lyrics file referenced by every track profile', () => {
    for (const track of Object.values(TRACKS_BY_ID)) {
      const lines = resolveLyrics(track.lyrics_ref)
      expect(() => parseLyrics({ lines })).not.toThrow()
    }
  })
})
```

- [ ] **Step 7: Починить тест агрегатора**

В `src/data/index.test.js` заменить тест перечисления треков на устойчивый к количеству:

```js
  it('indexes every track by its track_id', () => {
    expect(Object.keys(TRACKS_BY_ID).length).toBe(28)
    expect(TRACKS_BY_ID.cupsize_t10.title).toBe('ЗППП')
  })
```

и тест лирики:

```js
  it('resolves lyrics for a known lyrics_ref', () => {
    const lines = resolveLyrics(TRACKS_BY_ID.cupsize_t10.lyrics_ref)
    expect(Array.isArray(lines)).toBe(true)
    expect(lines.length).toBeGreaterThan(0)
  })
```

- [ ] **Step 8: Прогнать все тесты и сборку**

Run: `npm test -- --run && npm run build`
Expected: все тесты проходят. Если `parseLyrics` ожидает другую форму — свериться с `src/lib/lyrics/lyricsParser.js` и поправить вызов в тесте.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: import the full 26-track Cupsize album with curated titles and moods"
```

---

### Task 20: B6 — Экран артиста и свайп вверх

**Files:**
- Create: `src/ui/ArtistCard.jsx`, `src/ui/ArtistCard.test.jsx`
- Modify: `src/data/artists/*.json`, `src/lib/schema/artistSchema.js`
- Modify: `src/App.jsx`, `src/hooks/useSwipeGestures.js`, `src/index.css`

- [ ] **Step 1: Добавить био в схему артиста**

В `src/lib/schema/artistSchema.js` в `ArtistProfileSchema` добавить поле после `name`:

```js
  bio: z.string().optional(),
```

- [ ] **Step 2: Заполнить био**

В `src/data/artists/cupsize.json` добавить поле после `"name": "Cupsize",`:

```json
  "bio": "Панк-проект из Петербурга. Альбом «ЗМП» — 26 треков о боли, злости и нежности вперемешку.",
```

В `src/data/artists/placeholder-a.json`:

```json
  "bio": "Демонстрационный артист: индустриальное, агрессивное настроение для контраста визуальных пресетов.",
```

В `src/data/artists/placeholder-b.json`:

```json
  "bio": "Демонстрационный артист: меланхоличный дрим-поп, показывает мягкие пресеты и god rays.",
```

- [ ] **Step 3: Написать падающий тест карточки**

Create `src/ui/ArtistCard.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ArtistCard } from './ArtistCard.jsx'

const artist = { artist_id: 'cupsize', name: 'Cupsize', bio: 'Панк-проект из Петербурга.' }
const tracks = [
  { trackId: 't1', title: 'One', mood: 'aggressive_grunge' },
  { trackId: 't2', title: 'Two', mood: 'melancholic_sad' },
]

describe('ArtistCard', () => {
  it('renders nothing when closed', () => {
    render(<ArtistCard artist={artist} tracks={tracks} isOpen={false} onClose={() => {}} onSelectTrack={() => {}} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('shows the artist name, bio and track count', () => {
    render(<ArtistCard artist={artist} tracks={tracks} isOpen onClose={() => {}} onSelectTrack={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Cupsize' })).toBeInTheDocument()
    expect(screen.getByText('Панк-проект из Петербурга.')).toBeInTheDocument()
    expect(screen.getByText('2 tracks')).toBeInTheDocument()
  })

  it('lists the discography and reports picks', () => {
    const onSelectTrack = vi.fn()
    render(<ArtistCard artist={artist} tracks={tracks} isOpen onClose={() => {}} onSelectTrack={onSelectTrack} />)
    fireEvent.click(screen.getByRole('button', { name: /Two/ }))
    expect(onSelectTrack).toHaveBeenCalledWith('t2')
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(<ArtistCard artist={artist} tracks={tracks} isOpen onClose={onClose} onSelectTrack={() => {}} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('falls back gracefully when the artist has no bio', () => {
    render(
      <ArtistCard artist={{ ...artist, bio: undefined }} tracks={tracks} isOpen onClose={() => {}} onSelectTrack={() => {}} />,
    )
    expect(screen.getByRole('heading', { name: 'Cupsize' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Запустить тест — убедиться, что падает**

Run: `npx vitest run src/ui/ArtistCard.test.jsx`
Expected: FAIL — "Failed to resolve import './ArtistCard.jsx'".

- [ ] **Step 5: Реализовать**

Create `src/ui/ArtistCard.jsx`:

```jsx
import { useEffect } from 'react'
import { formatMood } from '../lib/library/buildLibrary.js'

export function ArtistCard({ artist, tracks, isOpen, onClose, onSelectTrack }) {
  useEffect(() => {
    if (!isOpen) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="artist-card" role="dialog" aria-label={`About ${artist.name}`}>
      <div className="artist-card__header">
        <h2 className="artist-card__name">{artist.name}</h2>
        <button type="button" onClick={onClose} aria-label="Close artist card">
          ✕
        </button>
      </div>
      {artist.bio && <p className="artist-card__bio">{artist.bio}</p>}
      <p className="artist-card__count">{tracks.length} tracks</p>
      <ul className="artist-card__list">
        {tracks.map((track) => (
          <li key={track.trackId}>
            <button type="button" className="artist-card__row" onClick={() => onSelectTrack(track.trackId)}>
              <span className="artist-card__title">{track.title}</span>
              <span className="artist-card__mood">{formatMood(track.mood)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 6: Запустить тест — убедиться, что проходит**

Run: `npx vitest run src/ui/ArtistCard.test.jsx`
Expected: PASS (5 тестов).

- [ ] **Step 7: Подключить свайп вверх в App.jsx**

Добавить импорт:

```jsx
import { ArtistCard } from './ui/ArtistCard.jsx'
```

Добавить состояние:

```jsx
  const [isArtistCardOpen, setIsArtistCardOpen] = useState(false)
```

В `useSwipeGestures` добавить обработчик:

```jsx
    onSwipeUp: () => setIsArtistCardOpen(true),
```

Отрендерить рядом с `<QueuePanel ... />`:

```jsx
      <ArtistCard
        artist={activeArtist}
        tracks={libraryEntries.filter((e) => e.artistId === activeArtist.artist_id)}
        isOpen={isArtistCardOpen}
        onClose={() => setIsArtistCardOpen(false)}
        onSelectTrack={(trackId) => {
          usePlayerStore.getState().setTrack(trackId)
          setIsArtistCardOpen(false)
        }}
      />
```

- [ ] **Step 8: Исключить карточку из свайпов**

В `src/hooks/useSwipeGestures.js`:

```js
      if (event.target.closest?.('.player-controls, .library-panel, .queue-panel, .seek-bar, .artist-card')) return
```

- [ ] **Step 9: Стили**

В `src/index.css` добавить:

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
  padding: 18px 18px 24px;
  background: rgba(10, 10, 10, 0.9);
  -webkit-backdrop-filter: blur(22px);
  backdrop-filter: blur(22px);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 22px 22px 0 0;
  color: #f2ede6;
  overflow: hidden;
}

.artist-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.artist-card__header button {
  appearance: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.06);
  color: inherit;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 50%;
  cursor: pointer;
}

.artist-card__name {
  margin: 0;
  font-size: 1.4rem;
}

.artist-card__bio {
  margin: 10px 0 0;
  color: rgba(242, 237, 230, 0.8);
  line-height: 1.5;
}

.artist-card__count {
  margin: 14px 0 6px;
  font-size: 0.8rem;
  color: rgba(242, 237, 230, 0.55);
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
  gap: 12px;
  text-align: left;
  border: none;
  background: transparent;
  color: inherit;
  padding: 10px 8px;
  border-radius: 10px;
  font-family: inherit;
  cursor: pointer;
}

.artist-card__row:hover {
  background: rgba(255, 255, 255, 0.08);
}

.artist-card__mood {
  font-size: 0.75rem;
  color: rgba(242, 237, 230, 0.5);
  white-space: nowrap;
}
```

- [ ] **Step 10: Прогнать все тесты и сборку**

Run: `npm test -- --run && npm run build`
Expected: все тесты проходят, сборка успешна.

- [ ] **Step 11: Commit**

```bash
git add src/ui/ArtistCard.jsx src/ui/ArtistCard.test.jsx src/data/artists/ src/lib/schema/artistSchema.js src/App.jsx src/hooks/useSwipeGestures.js src/index.css
git commit -m "feat: add artist discography card opened by swiping up"
```

---

# ФАЗА 5 — Модель данных под будущее (C4)

### Task 21: C4 — Расширить схему трека

**Контекст:** блоки опциональные — все 28 существующих профилей продолжают валидироваться без изменений. Смысл в том, чтобы будущий пайплайн загрузки пользовательских треков и нейроадаптация ложились без переделки движка.

**Files:**
- Modify: `src/lib/schema/trackSchema.js`, `src/lib/schema/trackSchema.test.js`

- [ ] **Step 1: Написать падающий тест**

В `src/lib/schema/trackSchema.test.js` добавить перед закрывающей скобкой верхнего `describe` (или в конец файла новый `describe`):

```js
describe('optional future-facing blocks', () => {
  const base = {
    track_id: 'x',
    tempo_bpm: 120,
    energy: 0.5,
    mood: 'aggressive_grunge',
    color_palette: { background: '#000000', primary: '#ffffff', secondary: '#ff0000' },
    shader_presets: { noise_type: 'laminar', outline_thickness: 0.02, bloom_intensity: 1 },
    lyrics_ref: 'a/b.json',
    audio_src: 'a/b.mp3',
  }

  it('still accepts a profile with no analysis or adaptation blocks', () => {
    expect(() => parseTrackProfile(base)).not.toThrow()
  })

  it('accepts structure segments, stems and spectral peaks', () => {
    expect(() =>
      parseTrackProfile({
        ...base,
        audio_analysis: {
          structure_segments: [{ start: 0, end: 15.2, label: 'intro' }],
          stem_urls: { drums: 'a/drums.mp3', vocals: 'a/vocals.mp3' },
          spectral_centroid_peaks: [0.12, 0.45],
        },
      }),
    ).not.toThrow()
  })

  it('rejects a segment whose end precedes its start', () => {
    expect(() =>
      parseTrackProfile({
        ...base,
        audio_analysis: { structure_segments: [{ start: 10, end: 5, label: 'intro' }] },
      }),
    ).toThrow()
  })

  it('accepts an ai_adaptation block', () => {
    expect(() =>
      parseTrackProfile({
        ...base,
        ai_adaptation: { facial_blendshape_weights: [0, 0.2, 0.8], generative_prompt_seed: 4294967295 },
      }),
    ).not.toThrow()
  })
})
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npx vitest run src/lib/schema/trackSchema.test.js`
Expected: FAIL ровно на одном тесте — "rejects a segment whose end precedes its start". Три остальных теста пройдут уже сейчас: Zod по умолчанию **молча отбрасывает** неизвестные ключи, а не бросает исключение, поэтому профиль с неописанными блоками валидируется без ошибки. Именно поэтому падает только проверка на невалидный сегмент — без схемы блок не проверяется вовсе. Если упало больше одного теста — остановиться и разобраться, схема ведёт себя не так, как ожидалось.

- [ ] **Step 3: Расширить схему**

В `src/lib/schema/trackSchema.js` добавить перед `TrackProfileSchema`:

```js
export const StructureSegmentSchema = z
  .object({
    start: z.number().min(0),
    end: z.number().min(0),
    label: z.string().min(1),
  })
  .refine((segment) => segment.end >= segment.start, {
    message: 'segment end must not precede its start',
  })

// Опциональный блок предвычисленного анализа. Заполняется будущим
// бэкендом/пайплайном загрузки; при его отсутствии движок работает на
// обычном FFT общего микса, как сейчас.
export const AudioAnalysisSchema = z.object({
  structure_segments: z.array(StructureSegmentSchema).optional(),
  stem_urls: z.record(z.string(), z.string().min(1)).optional(),
  spectral_centroid_peaks: z.array(z.number()).optional(),
})

export const AiAdaptationSchema = z.object({
  facial_blendshape_weights: z.array(z.number()).optional(),
  generative_prompt_seed: z.number().int().nonnegative().optional(),
})
```

и в `TrackProfileSchema` добавить после `audio_src`:

```js
  audio_analysis: AudioAnalysisSchema.optional(),
  ai_adaptation: AiAdaptationSchema.optional(),
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npx vitest run src/lib/schema/trackSchema.test.js`
Expected: PASS.

- [ ] **Step 5: Прогнать все тесты и сборку**

Run: `npm test -- --run && npm run build`
Expected: все тесты проходят (все 28 существующих профилей валидируются без изменений), сборка успешна.

- [ ] **Step 6: Commit**

```bash
git add src/lib/schema/trackSchema.js src/lib/schema/trackSchema.test.js
git commit -m "feat: allow optional audio_analysis and ai_adaptation blocks in track profiles"
```

---

### Task 22: Финальная проверка и обновление документации

- [ ] **Step 1: Прогнать всё**

Run: `npm test -- --run && npm run build`
Expected: все тесты проходят, сборка успешна.

- [ ] **Step 2: Задеплоить**

```bash
git push origin master
gh run watch $(gh run list --limit 1 --json databaseId --jq '.[0].databaseId') --exit-status
```

- [ ] **Step 3: Полная проверка вживую**

Открыть `https://zazser82-methedron.github.io/MATplayer/?v=final`. Проверить сквозной сценарий: библиотека открывается и показывает 28 треков → поиск по названию находит трек → клик запускает его → waveform построен → seek работает → громкость регулируется → shuffle/repeat переключаются → свайп-вверх (или ресайз в мобильный вид) открывает карточку артиста → звёздочка сохраняется после перезагрузки. Снять скриншот.

- [ ] **Step 4: Проверить консоль**

Ожидается только `favicon.ico` 404.

- [ ] **Step 5: Обновить STATE.md**

В `STATE.md` в раздел `## Done` добавить пункт про раунд 2: что реализовано (16 пунктов отчёта Gemini), сколько тестов, сколько треков в библиотеке. В `## Next` убрать закрытые пункты (арт-дирекшн, кроссфейд, BPM, 23 трека, деградация) и оставить только оставшиеся.

- [ ] **Step 6: Обновить заметку во втором мозге**

В `C:\Users\exxck\Projects\_second-brain\Сайты.md` в раздел MATplayer добавить абзац про раунд 2: что отчёт Gemini был сверен с кодом и три его пункта оказались неточными (линейный кроссфейд вместо equal-power, общий пропущенный шаг decodeAudioData для BPM/waveform, уже существующая лесенка деградации с неподключённым уровнем), плюс что в репозиторий добавлено 174 МБ аудио.

- [ ] **Step 7: Commit**

```bash
git add STATE.md
git commit -m "docs: update STATE.md after round-2 implementation"
git push origin master
```

---

## Самопроверка плана

**Покрытие рекомендаций отчёта:**

| Пункт | Задача | Статус |
|-------|--------|--------|
| A1 Tone mapping / Bloom | Task 2 | ✅ |
| A2 Toon-рампа / контуры | Task 7 (контуры уже были) | ✅ |
| A3 noise_type | Task 3 | ✅ |
| A4 God Rays | Task 4 | ✅ |
| A5 Контраст лирики | Task 5 | ✅ |
| B1 Очередь/shuffle/repeat | Task 10 | ✅ |
| B2 Громкость | Task 9 | ✅ |
| B3 Waveform seek | Task 17 | ✅ |
| B4 Избранное/история | Task 11 | ✅ |
| B5 Deep linking | Task 12 | ✅ |
| B6 Карточка артиста | Task 20 | ✅ |
| C1 Equal-power кроссфейд | Task 14 | ✅ |
| C2 BPM-пульсации | Task 16 | ✅ |
| C3 Лесенка деградации | Task 6 | ✅ |
| C4 Схема данных | Task 21 | ✅ |
| C5 26 треков | Task 19 | ✅ |

**Осознанно не сделано:**
- Sobel-контуры по буферам глубины/нормалей (альтернатива из A2) — inverted hull уже работает и дешевле; переход на Sobel имеет смысл только если контур понадобится и на частицах.
- `@use-gesture/react` из B6 — свой `useSwipeGestures` уже распознаёт свайп вверх (`classifySwipe` возвращает `'up'`), достаточно подключить обработчик. Новая зависимость не нужна.
- Миграция на drei `<PerformanceMonitor>` из C3 — своя лесенка работает, ей не хватало только публикации уровня.
- Полный переход воспроизведения на `AudioBufferSourceNode` — потеря нативного стриминга не окупается.
- `AudioCrossfader` подключается формулой (Task 14), но сам класс так и не встраивается в граф Web Audio: при текущей архитектуре с одним `<audio>`-элементом нет второго источника, между которым можно сводить. Реальный кроссфейд между треками потребует двух `<audio>`-элементов и переключения источников — отдельная задача, вне этого плана.
