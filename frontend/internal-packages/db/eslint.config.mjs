import { fileURLToPath } from 'node:url'
import { createBaseConfig } from '../../internal-packages/configs/eslint/index.js'

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url))

export default [
  ...createBaseConfig({
    tsconfigPath: './tsconfig.json',
    gitignorePath,
  }),
  {
    ignores: ['supabase/**/*'],
  },
]
