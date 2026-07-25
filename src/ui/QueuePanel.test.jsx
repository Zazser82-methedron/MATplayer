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

  it('calls onClose from the close button', () => {
    const onClose = vi.fn()
    render(<QueuePanel entries={entries} isOpen activeTrackId="t1" onSelect={() => {}} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close queue' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
