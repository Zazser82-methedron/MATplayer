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

// Возвращает тот из двух вариантов, что даёт больший контраст с фоном.
// Это НЕ гарантия WCAG AA: на средне-серых фонах максимум недостижим —
// худший случай #777777 даёт лишь 4.478:1 при пороге 4.5:1 (полоса примерно
// #747474..#797979 не проходит ни с чёрным, ни с белым). Для всех текущих
// палитр треков (очень тёмные фоны) запас двукратный, но при добавлении
// светлых палитр читаемость нужно проверять отдельно.
export function pickReadableTextColor(backgroundHex) {
  return contrastRatio(LIGHT_TEXT, backgroundHex) >= contrastRatio(DARK_TEXT, backgroundHex)
    ? LIGHT_TEXT
    : DARK_TEXT
}
