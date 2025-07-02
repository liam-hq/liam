import { includeIgnoreFile } from '@eslint/compat'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import { requireUseServerPlugin } from './require-use-server-plugin.js'
import { noNonEnglishPlugin } from './no-non-english-plugin.js'

/**
 * Base ESLint configuration with typescript-eslint setup
 * @param {Object} options Configuration options
 * @param {string} options.tsconfigPath Path to tsconfig.json file
 * @returns {Array} ESLint configuration array
 */
export function createBaseConfig(options = {}) {
  const { tsconfigPath = './tsconfig.json', gitignorePath } = options

  const heavyRules = [
    {
      files: ['**/*.ts', '**/*.tsx'],
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
  const additionalRules = process.env['HEAVY_LINT'] ? heavyRules : []

  return [
    includeIgnoreFile(gitignorePath),
    {
      files: ['**/*.ts', '**/*.tsx'],
      ignores: [
        '**/trigger.config.ts',
        '**/vitest.config.ts',
        '**/dist/**',
        '**/.trigger/**',
        '**/app/.well-known/**',
      ],
      plugins: {
        '@typescript-eslint': tseslint,
        'require-use-server': requireUseServerPlugin,
        'no-non-english': noNonEnglishPlugin,
      },
      languageOptions: {
        parser: tsParser,
        parserOptions: {
          projectService: tsconfigPath,
          ecmaVersion: 2022,
          sourceType: 'module',
        },
      },
      rules: {
        '@typescript-eslint/no-unsafe-member-access': 'error',
        'require-use-server/require-use-server': 'error',
        'no-non-english/no-non-english-characters': 'error',
      },
    },
    {
      files: ['**/trigger.config.ts', '**/vitest.config.ts'],
      plugins: {
        '@typescript-eslint': tseslint,
        'no-non-english': noNonEnglishPlugin,
      },
      languageOptions: {
        parser: tsParser,
        parserOptions: {
          ecmaVersion: 2022,
          sourceType: 'module',
        },
      },
      rules: {
        'no-non-english/no-non-english-characters': 'error',
      },
    },
    ...additionalRules,
  ]
}
