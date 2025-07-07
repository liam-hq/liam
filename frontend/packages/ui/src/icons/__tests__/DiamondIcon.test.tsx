import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DiamondIcon } from '../DiamondIcon'

describe('DiamondIcon', () => {
  it('renders without crashing', () => {
    render(<DiamondIcon />)
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('applies custom color through style prop', () => {
    render(<DiamondIcon style={{ color: 'red' }} />)
    const svg = screen.getByRole('img')
    expect(svg).toHaveStyle({ color: 'red' })
  })

  it('applies custom width and height', () => {
    render(<DiamondIcon width={32} height={32} />)
    const svg = screen.getByRole('img')
    expect(svg).toHaveAttribute('width', '32')
    expect(svg).toHaveAttribute('height', '32')
  })

  it('applies custom className', () => {
    render(<DiamondIcon className="custom-icon" />)
    const svg = screen.getByRole('img')
    expect(svg).toHaveClass('custom-icon')
  })

  it('applies custom data attributes', () => {
    render(<DiamondIcon data-testid="diamond-icon" />)
    const svg = screen.getByRole('img')
    expect(svg).toHaveAttribute('data-testid', 'diamond-icon')
  })

  it('applies custom onClick handler', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<DiamondIcon onClick={handleClick} />)
    const svg = screen.getByRole('img')
    await user.click(svg)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
