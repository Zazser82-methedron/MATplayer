import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

// Читаем файл напрямую через fs, а не через ESM-импорт: Vitest по умолчанию
// стабит .css-импорты пустой строкой (test.css: false в конфиге), это
// затрагивает и запросы вида `?raw` — импорт возвращал бы "" вместо
// реального содержимого файла. import.meta.url в транспилированном модуле
// не гарантированно file:// (Vitest подставляет виртуальный URL), поэтому
// путь берём от корня репозитория — vitest всегда запускается оттуда.
const css = readFileSync('src/index.css', 'utf-8')

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
