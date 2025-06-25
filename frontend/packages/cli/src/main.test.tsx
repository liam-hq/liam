import { describe, expect, it, vi } from 'vitest'

const mockRender = vi.fn()
const mockCreateRoot = vi.fn(() => ({
  render: mockRender,
}))

vi.mock('react-dom/client', () => ({
  createRoot: mockCreateRoot,
}))

vi.mock('./App.js', () => ({
  default: () => 'App',
}))

describe('main', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create root and render App', async () => {
    document.body.innerHTML = '<div id="root"></div>'
    
    await import('./main.js')
    
    expect(mockCreateRoot).toHaveBeenCalledWith(document.getElementById('root'))
    expect(mockRender).toHaveBeenCalled()
  })

  it('should handle missing root element', async () => {
    document.body.innerHTML = ''
    
    vi.resetModules()
    await import('./main.js')
    
    expect(mockCreateRoot).not.toHaveBeenCalled()
  })
})
