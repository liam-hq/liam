import { includeIgnoreFile } from '@eslint/compat'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import cssModules from 'eslint-plugin-css-modules'

/**
 * Base ESLint configuration with typescript-eslint setup
 * @param {Object} options Configuration options
 * @param {string} options.tsconfigPath Path to tsconfig.json file
 * @returns {Array} ESLint configuration array
 */
export function createBaseConfig(options = {}) {
  const { tsconfigPath = './tsconfig.json', gitignorePath } = options

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
        'css-modules': cssModules,
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
        "css-modules/no-undef-class": ["error", { camelCase: true }],
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
