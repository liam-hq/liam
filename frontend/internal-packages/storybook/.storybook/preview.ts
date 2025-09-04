import type { Preview } from '@storybook/nextjs'
import '@liam-hq/ui/src/styles/globals.css'
import { initialize, mswDecorator } from 'msw-storybook-addon'

// Initialize MSW
initialize()

if (typeof window !== 'undefined') {
  const mockRouter = {
    push: (url: string) => console.log('Router push:', url),
    replace: (url: string) => console.log('Router replace:', url),
    back: () => console.log('Router back'),
    forward: () => console.log('Router forward'),
    refresh: () => console.log('Router refresh'),
    prefetch: (url: string) => console.log('Router prefetch:', url),
  }

  const mockUseRouter = () => mockRouter
  const mockUsePathname = () => '/mock-pathname'
  const mockUseSearchParams = () => new URLSearchParams()

  try {
    const modulePath = require.resolve('next/navigation')
    const originalModule = require.cache[modulePath]
    
    if (originalModule) {
      const mockedModule = {
        ...originalModule.exports,
        useRouter: mockUseRouter,
        usePathname: mockUsePathname,
        useSearchParams: mockUseSearchParams,
        redirect: (url: string) => console.log('Redirect:', url),
      }
      
      originalModule.exports = mockedModule
    }
  } catch (error) {
    console.warn('Failed to mock next/navigation:', error)
  }
}

// Mock Supabase environment variables
if (typeof process !== 'undefined') {
  process.env.NEXT_PUBLIC_SUPABASE_URL =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key'
}

const decorators = [mswDecorator]

const preview: Preview = {
  decorators,
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      options: {
        light: { name: 'Light', value: '#f8f8f8' },
        dark: { name: 'Dark', value: '#333333' },
      },
    },
    layout: 'centered',
  },
  initialGlobals: {
    backgrounds: { value: 'dark' },
  },
  tags: ['autodocs'],
}

export default preview
