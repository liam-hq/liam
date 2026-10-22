import type { Preview } from '@storybook/nextjs'

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
      options: {
        light: { name: 'Light', value: '#f8f8f8' },
        dark: { name: 'Dark', value: 'var(--global-background)' },
      },
    },
    layout: 'centered',
    nextjs: {
      appDirectory: true,
    },
  },
  initialGlobals: {
    backgrounds: { value: 'dark' },
  },
  tags: ['autodocs'],
}

export default preview
