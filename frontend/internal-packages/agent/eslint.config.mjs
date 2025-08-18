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
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TryStatement',
          message:
            'Try-catch statements are not allowed in @liam-hq/agent package. Use Result types from neverthrow instead.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@langchain/core/callbacks/dispatch',
              importNames: ['dispatchCustomEvent'],
              message:
                'Direct use of dispatchCustomEvent is not allowed. Use the wrapper function from src/stream/dispatchCustomEvent.ts instead.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/stream/dispatchCustomEvent.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
]
