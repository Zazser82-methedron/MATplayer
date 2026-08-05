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
