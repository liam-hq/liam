import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

/**
 * Base ESLint configuration with typescript-eslint setup
 * @param {Object} options Configuration options
 * @param {string} options.tsconfigPath Path to tsconfig.json file
 * @returns {Array} ESLint configuration array
 */
export function createBaseConfig(options = {}) {
  const { tsconfigPath = './tsconfig.json' } = options

  return [
    {
      files: ['**/*.ts', '**/*.tsx'],
      ignores: ['**/trigger.config.ts', '**/vitest.config.ts'],
      plugins: {
        '@typescript-eslint': tseslint,
      },
      languageOptions: {
        parser: tsParser,
        parserOptions: {
          project: tsconfigPath,
          ecmaVersion: 2022,
          sourceType: 'module',
        },
      },
      rules: {
        '@typescript-eslint/no-unsafe-member-access': 'error',
      },
    },
    {
      files: ['**/trigger.config.ts', '**/vitest.config.ts'],
      plugins: {
        '@typescript-eslint': tseslint,
      },
      languageOptions: {
        parser: tsParser,
        parserOptions: {
          ecmaVersion: 2022,
          sourceType: 'module',
        },
      },
      rules: {},
    },
  ]
}
