import type { Preview } from '@storybook/nextjs'
import '@liam-hq/ui/src/styles/globals.css'
import { initialize, mswDecorator } from 'msw-storybook-addon'

// Initialize MSW
initialize()

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
