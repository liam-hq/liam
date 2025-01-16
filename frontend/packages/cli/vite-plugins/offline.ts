import type { Plugin } from 'vite'

export function offlinePlugin(): Plugin {
  return {
    name: 'offline' as const,
    apply: 'build' as const,
    enforce: 'post' as const,
    // offlien plugin
    // https://github.com/JuanQP/vite-plugin-make-offline/blob/v1.0.1/src/index.ts
    transformIndexHtml(html: string) {
      return html
        .replace(' type="module" crossorigin ', ' defer ')
        .replace(' defer type="text/javascript"', ' type="text/javascript"')
    },
  }
}

export default offlinePlugin
