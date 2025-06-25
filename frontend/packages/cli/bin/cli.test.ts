import { describe, expect, it, vi } from 'vitest'

vi.mock('../src/cli/index.js', () => ({
  program: {
    parse: vi.fn(),
  },
}))

describe('CLI bin', () => {
  it('should call program.parse with process.argv', async () => {
    const { program } = await import('../src/cli/index.js')
    
    await import('./cli.js')
    
    expect(program.parse).toHaveBeenCalledWith(process.argv)
  })
})
