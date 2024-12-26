import CopyPlugin from 'copy-webpack-plugin'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/erd/p/\\[\\.\\.\\.slug\\]': ['./.next/server/prism.wasm'],
  },
  webpack: (config) => {
    config.plugins.push(
      new CopyPlugin({
        patterns: [
          {
            from: 'node_modules/@liam-hq/db-structure/dist/parser/schemarb/prism.wasm',
            to: './server/prism.wasm',
          },
        ],
      }),
    )
    return config
  },
}

export default nextConfig
