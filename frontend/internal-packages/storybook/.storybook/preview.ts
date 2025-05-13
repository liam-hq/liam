import type { Preview } from '@storybook/react'
import '@liam-hq/ui/src/styles/globals.css'
import { getLangfuseWeb } from './langfuseWeb.mock'

// Initialize the mock for Storybook
if (typeof window !== 'undefined') {
  window.__STORYBOOK_LANGFUSE_MOCK__ = getLangfuseWeb()
}

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#f8f8f8' },
        { name: 'dark', value: '#333333' },
      ],
    },
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default preview
