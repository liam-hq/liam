import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ErdIcon } from '../ErdIcon'

describe('ErdIcon', () => {
  it('renders without crashing', () => {
    render(<ErdIcon />)
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('applies custom color through style prop', () => {
    render(<ErdIcon style={{ color: 'red' }} />)
    const svg = screen.getByRole('img')
    expect(svg).toHaveStyle({ color: 'red' })
  })

  it('applies custom width and height', () => {
    render(<ErdIcon width={32} height={32} />)
    const svg = screen.getByRole('img')
    expect(svg).toHaveAttribute('width', '32')
    expect(svg).toHaveAttribute('height', '32')
  })

  it('applies custom className', () => {
    render(<ErdIcon className="custom-icon" />)
    const svg = screen.getByRole('img')
    expect(svg).toHaveClass('custom-icon')
  })

  it('applies custom data attributes', () => {
    render(<ErdIcon data-testid="erd-icon" />)
    const svg = screen.getByRole('img')
    expect(svg).toHaveAttribute('data-testid', 'erd-icon')
  })

  it('applies custom onClick handler', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<ErdIcon onClick={handleClick} />)
    const svg = screen.getByRole('img')
    await user.click(svg)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
