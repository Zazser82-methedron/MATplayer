import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SeekBar, formatTimestamp } from './SeekBar.jsx'

describe('formatTimestamp', () => {
  it('formats minutes and zero-padded seconds', () => {
    expect(formatTimestamp(65)).toBe('1:05')
    expect(formatTimestamp(0)).toBe('0:00')
    expect(formatTimestamp(600)).toBe('10:00')
  })

  it('survives NaN and negatives, which appear before metadata loads', () => {
    expect(formatTimestamp(NaN)).toBe('0:00')
    expect(formatTimestamp(-5)).toBe('0:00')
    expect(formatTimestamp(Infinity)).toBe('0:00')
  })
})

describe('SeekBar', () => {
  it('exposes progress through an accessible slider', () => {
    render(<SeekBar currentTime={30} duration={120} peaks={[]} onSeek={() => {}} />)
    const slider = screen.getByRole('slider', { name: 'Seek' })
    expect(slider).toHaveValue('30')
    expect(slider).toHaveAttribute('max', '120')
  })

  it('does not seek while the slider is still being dragged', () => {
    const onSeek = vi.fn()
    render(<SeekBar currentTime={30} duration={120} peaks={[]} onSeek={onSeek} />)
    fireEvent.change(screen.getByRole('slider', { name: 'Seek' }), { target: { value: '75' } })
    expect(onSeek).not.toHaveBeenCalled()
    // Позиция при этом уже показывается новая — иначе ползунок отскакивал бы
    // назад под пальцем, пока стор толкает в него время воспроизведения.
    expect(screen.getByText('1:15')).toBeInTheDocument()
  })

  it('seeks once when the drag is released', () => {
    const onSeek = vi.fn()
    render(<SeekBar currentTime={30} duration={120} peaks={[]} onSeek={onSeek} />)
    const slider = screen.getByRole('slider', { name: 'Seek' })
    fireEvent.change(slider, { target: { value: '75' } })
    fireEvent.pointerUp(slider)
    expect(onSeek).toHaveBeenCalledTimes(1)
    expect(onSeek).toHaveBeenCalledWith(75)
  })

  it('ignores a release that was not preceded by a drag', () => {
    const onSeek = vi.fn()
    render(<SeekBar currentTime={30} duration={120} peaks={[]} onSeek={onSeek} />)
    fireEvent.pointerUp(screen.getByRole('slider', { name: 'Seek' }))
    expect(onSeek).not.toHaveBeenCalled()
  })

  it('follows playback again after the drag is committed', () => {
    const { rerender } = render(<SeekBar currentTime={30} duration={120} peaks={[]} onSeek={() => {}} />)
    const slider = screen.getByRole('slider', { name: 'Seek' })
    fireEvent.change(slider, { target: { value: '75' } })
    fireEvent.pointerUp(slider)
    rerender(<SeekBar currentTime={76} duration={120} peaks={[]} onSeek={() => {}} />)
    expect(screen.getByText('1:16')).toBeInTheDocument()
  })

  it('renders readable timestamps for position and duration', () => {
    render(<SeekBar currentTime={65} duration={125} peaks={[]} onSeek={() => {}} />)
    expect(screen.getByText('1:05')).toBeInTheDocument()
    expect(screen.getByText('2:05')).toBeInTheDocument()
  })

  it('survives a zero duration before metadata loads', () => {
    render(<SeekBar currentTime={0} duration={0} peaks={[]} onSeek={() => {}} />)
    expect(screen.getByRole('slider', { name: 'Seek' })).toBeInTheDocument()
  })

  it('renders one bar per waveform peak and marks the played portion', () => {
    const { container } = render(
      <SeekBar currentTime={50} duration={100} peaks={[0.1, 0.5, 0.9, 0.3]} onSeek={() => {}} />,
    )
    const bars = container.querySelectorAll('.seek-bar__peak')
    expect(bars).toHaveLength(4)
    // Прогресс 50% — закрашены доли 0/4 и 1/4 и 2/4, но не 3/4.
    expect(bars[0]).toHaveAttribute('data-played', 'true')
    expect(bars[3]).not.toHaveAttribute('data-played')
  })
})
