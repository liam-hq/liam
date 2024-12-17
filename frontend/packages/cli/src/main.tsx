import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './globals.css'
import riveWASMResource from '@rive-app/canvas/rive.wasm?url'

const rootElement = document.getElementById('root')
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <link
        rel="preload"
        href={riveWASMResource}
        as="fetch"
        crossOrigin="anonymous"
      />
      <App />
    </StrictMode>,
  )
}
