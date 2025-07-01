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
    rules: {
      complexity: ['warn', { max: 10 }],
      'max-lines': [
        'warn',
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
      'max-lines-per-function': [
        'warn',
        { max: 50, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
      'max-depth': ['warn', 4],
      'max-params': ['warn', 4],
      'max-statements': ['warn', 20],
      'max-nested-callbacks': ['warn', 3],
    },
  },
]
