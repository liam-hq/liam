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
      default: 'dark',
      values: [
        { name: 'light', value: '#f8f8f8' },
        { name: 'dark', value: 'var(--global-background, #141616)' },
      ],
    },
    layout: 'centered',
    docs: {
      story: {
        inline: false,
        iframeHeight: 600,
      },
    },
  },
  tags: ['autodocs'],
}

export default preview
