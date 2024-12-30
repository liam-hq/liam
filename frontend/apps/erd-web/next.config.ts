import { execSync } from 'node:child_process'
import type { NextConfig } from 'next'

const gitCommitHash = execSync('git rev-parse --short HEAD').toString().trim()
const releaseDate = new Date().toISOString().split('T')[0]

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/erd/p/\\[\\.\\.\\.slug\\]': ['./prism.wasm'],
  },
  env: {
    NEXT_PUBLIC_GIT_HASH: gitCommitHash,
    NEXT_PUBLIC_RELEASE_DATE: releaseDate,
  },
  assetPrefix: process.env.ASSET_PREFIX,
}

export default nextConfig
