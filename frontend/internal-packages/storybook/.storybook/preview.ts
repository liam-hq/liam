import type { Preview } from '@storybook/react'
import React from 'react'
import '@liam-hq/ui/src/styles/globals.css'
import { getLangfuseWeb } from './langfuseWeb.mock'

if (typeof document !== 'undefined') {
  if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
    const fontLink = document.createElement('link')
    fontLink.rel = 'stylesheet'
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap'
    document.head.appendChild(fontLink)
  }
  
  const applyFonts = () => {
    document.body.style.fontFamily = 'Inter, sans-serif'
    document.documentElement.style.setProperty('--main-font', 'Inter')
    document.documentElement.style.setProperty('--message-font', 'Montserrat')
    document.documentElement.style.setProperty('--code-font', 'IBM Plex Mono')
  }
  
  applyFonts()
  document.fonts.ready.then(applyFonts)
}

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
        { name: 'dark', value: '#333333' },
      ],
    },
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      React.useEffect(() => {
        if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
          const fontLink = document.createElement('link')
          fontLink.rel = 'stylesheet'
          fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap'
          document.head.appendChild(fontLink)
        }
        
        document.body.style.fontFamily = 'Inter, sans-serif'
        document.documentElement.style.setProperty('--message-font', 'Montserrat')
        
        const style = document.createElement('style')
        style.textContent = `
          * { font-family: Inter, sans-serif !important; }
          body { font-family: Inter, sans-serif !important; }
          .sidebar-container, .panel-container, .sb-bar { font-family: Inter, sans-serif !important; }
        `
        if (!document.querySelector('style[data-storybook-fonts]')) {
          style.setAttribute('data-storybook-fonts', 'true')
          document.head.appendChild(style)
        }
      }, [])
      
      return React.createElement(Story)
    },
  ],
}

export default preview
