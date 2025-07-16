import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js headers module globally
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: () => [],
    set: vi.fn(),
    get: vi.fn(),
  })),
}))
