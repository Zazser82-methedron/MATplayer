import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VolumeControl } from './VolumeControl.jsx'

describe('VolumeControl', () => {
  it('renders a labelled slider reflecting the current volume', () => {
    render(<VolumeControl uiVolume={0.5} isMuted={false} onChange={() => {}} onToggleMute={() => {}} />)
    expect(screen.getByRole('slider', { name: 'Volume' })).toHaveValue('0.5')
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
