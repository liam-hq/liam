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
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@langchain/langgraph/prebuilt',
              importNames: ['createReactAgent'],
              message:
                'createReactAgent is not allowed. Use LangGraph core primitives (nodes, edges, state management) instead to maintain control over prompts and agent behavior.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TryStatement',
          message:
            'Try-catch statements are not allowed in @liam-hq/agent package. Use Result types from neverthrow instead.',
        },
      ],
    },
  },
]
