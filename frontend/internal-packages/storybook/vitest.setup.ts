import * as React from 'react'
import '@testing-library/jest-dom/vitest'
import { setProjectAnnotations } from '@storybook/react'
import * as globalStorybookConfig from './.storybook/preview'

// Make React available globally
globalThis.React = React

// Add process polyfill for Next.js compatibility
if (typeof process === 'undefined') {
  globalThis.process = {
    env: {
      NODE_ENV: 'test',
    },
  } as any
}

// Apply global Storybook configuration to all tests
setProjectAnnotations(globalStorybookConfig)

// Mock modules that might cause issues in test environment
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/test',
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => 
    React.createElement('img', { src, alt, ...props }),
}))