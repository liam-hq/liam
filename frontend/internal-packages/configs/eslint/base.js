import { includeIgnoreFile } from '@eslint/compat'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import unicorn from 'eslint-plugin-unicorn'
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
        'unicorn': unicorn,
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
        '@typescript-eslint/consistent-type-assertions': ['error', {
          assertionStyle: 'as',
          objectLiteralTypeAssertions: 'never'
        }],
        'require-use-server/require-use-server': 'error',
        'no-non-english/no-non-english-characters': 'error',
        'unicorn/filename-case': ['error', {
          cases: {
            camelCase: true,
            pascalCase: true
          },
          ignore: [
            '^global-error\\.(tsx?)$',
            '^instrumentation-client\\.(ts)$',
            '^\\..*',
            'README\\.md$'
          ]
        }],
        'no-restricted-exports': ['error', {
          'restrictedNamedExports': ['*']
        }],
        'no-restricted-syntax': [
          'error',
          {
            'selector': 'ExportNamedDeclaration[source]',
            'message': 'Re-exports are not allowed except in index.ts files'
          }
        ],
      },
    },
    {
      files: ['index.ts', '**/index.ts'],
      rules: {
        'no-restricted-exports': 'off',
        'no-restricted-syntax': 'off',
      },
    },
    {
      files: ['**/DropdownMenu/DropdownMenu.tsx', '**/parser.ts'],
      rules: {
        'no-restricted-syntax': 'off',
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
  ]
}
