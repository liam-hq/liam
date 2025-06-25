import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.js'

describe('App', () => {
  it('should render the main heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Liam CLI')).toBeInTheDocument()
  })

  it('should render the description', () => {
    render(<App />)
    expect(screen.getByText(/CLI tool for Liam/)).toBeInTheDocument()
  })

  it('should render the usage section', () => {
    render(<App />)
    expect(screen.getByText('Usage')).toBeInTheDocument()
  })

  it('should render command examples', () => {
    render(<App />)
    expect(screen.getByText(/npx @liam-hq\/cli/)).toBeInTheDocument()
  })

  it('should render links section', () => {
    render(<App />)
    expect(screen.getByText('Links')).toBeInTheDocument()
  })

  it('should render documentation link', () => {
    render(<App />)
    const docLink = screen.getByRole('link', { name: /Documentation/ })
    expect(docLink).toBeInTheDocument()
    expect(docLink).toHaveAttribute('href', 'https://liambx.com/docs')
  })

  it('should render GitHub repository link', () => {
    render(<App />)
    const repoLink = screen.getByRole('link', { name: /GitHub Repository/ })
    expect(repoLink).toBeInTheDocument()
    expect(repoLink).toHaveAttribute('href', 'https://github.com/liam-hq/liam')
  })

  it('should render discussions link', () => {
    render(<App />)
    const discussionsLink = screen.getByRole('link', { name: /Discussions/ })
    expect(discussionsLink).toBeInTheDocument()
    expect(discussionsLink).toHaveAttribute('href', 'https://github.com/liam-hq/liam/discussions')
  })
})
