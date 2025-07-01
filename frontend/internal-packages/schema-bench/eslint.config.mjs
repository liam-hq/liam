import { fileURLToPath } from 'node:url'
import { createBaseConfig } from '../../internal-packages/configs/eslint/index.js'

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url))

const baseConfig = createBaseConfig({
  tsconfigPath: './tsconfig.json',
  gitignorePath,
})

export default [
  ...baseConfig,
  {
    files: ['src/workspace/**/*.ts', '**/*.tsx'],
    ignores: ['**/*.test.ts'],
    rules: {
      complexity: ['error', { max: 10 }],
      'max-lines': [
        'error',
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
      'max-lines-per-function': [
        'error',
        { max: 40, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
      'max-depth': ['error', 4],
      'max-params': ['error', 4],
      'max-statements': ['error', 20],
      'max-nested-callbacks': ['error', 3],
    },
  },
]
