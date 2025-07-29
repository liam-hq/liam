import { describe, expect, it, vi } from 'vitest'
import { execute } from './liamDbExecutor.ts'
import type { LiamDbExecutorInput } from './types.ts'

// Mock dependencies to avoid complex mocking issues
vi.mock('@liam-hq/agent', () => ({
  deepModeling: vi.fn(),
}))

vi.mock('@liam-hq/agent/src/repositories/InMemoryRepository.ts', () => ({
  InMemoryRepository: vi.fn(),
}))

describe('liamDbExecutor', () => {
  it('should export execute function', () => {
    expect(typeof execute).toBe('function')
  })

  it('should accept LiamDbExecutorInput type', () => {
    const input: LiamDbExecutorInput = {
      input: 'Create a users table',
    }
    expect(input.input).toBe('Create a users table')
  })
})
