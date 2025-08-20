import { fileURLToPath } from 'node:url'
import { createBaseConfig } from '../../internal-packages/configs/eslint/index.js'

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url))

export default [
  ...createBaseConfig({
    tsconfigPath: './tsconfig.json',
    gitignorePath,
  }),
  {
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSPropertySignature[optional=true]',
          message:
            'Optional properties are not allowed. Use required properties instead.',
        },
        {
          selector: 'TSMethodSignature[optional=true]',
          message:
            'Optional methods are not allowed. Use required methods instead.',
        },
      ],
    },
  },
]
