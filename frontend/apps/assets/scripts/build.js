const fs = require('fs-extra')
const path = require('node:path')

async function build() {
  const outputDir = '.vercel/output'
  const staticDir = path.join(outputDir, 'static')

  // Clean and create output directory
  await fs.emptyDir(outputDir)

  // Copy public files to static directory
  await fs.copy('public', staticDir)

  // Create config.json for Vercel Output API
  const config = {
    version: 3,
    routes: [
      {
        src: '/(.*)',
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        },
      },
    ],
  }

  await fs.writeJson(path.join(outputDir, 'config.json'), config, { spaces: 2 })

  // biome-ignore lint/suspicious/noConsole: Build output is necessary
  console.log('✅ Build completed successfully')
  // biome-ignore lint/suspicious/noConsole: Build output is necessary
  console.log(`📦 Output directory: ${outputDir}`)
}

build().catch((error) => {
  console.error('❌ Build failed:', error)
  process.exit(1)
})
