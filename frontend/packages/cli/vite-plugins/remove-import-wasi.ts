import fs from 'node:fs'
import type { Plugin } from 'vite'

// The `import 'wasi'` statement is dynamically imported within the db-structure package.
// However, `import 'wasi';` gets included in the build output.
// To address this, the buildEnd hook removes it from the build artifact.
export function renameImportWasi(): Plugin {
  return {
    name: 'remove-import-wasi',
    buildEnd() {
      const filePath = 'dist-cli/bin/cli.js'
      const originalContent = fs.readFileSync(filePath, 'utf8')
      const content = originalContent.replace(/import 'wasi';\s*/g, '')
      fs.writeFileSync(filePath, content, 'utf8')
    },
  }
}

export default renameImportWasi
