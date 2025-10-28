import { fileURLToPath } from 'node:url'
import { createBaseConfig } from '../../internal-packages/configs/eslint/index.js'

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url))

export default [
  ...createBaseConfig({
    tsconfigPath: './tsconfig.json',
    gitignorePath,
  }),
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // Allow importing from neverthrow in this package since we're re-exporting it
      'no-restricted-imports': 'off',
      // Allow type assertions for generic type parameter handling
      '@typescript-eslint/consistent-type-assertions': 'off',
    },
  },
]
