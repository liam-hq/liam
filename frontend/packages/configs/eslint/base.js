import { includeIgnoreFile } from '@eslint/compat'
import {  globalIgnores } from "eslint/config";
import tseslint from 'typescript-eslint';
import tsParser from '@typescript-eslint/parser'

/**
 * Base ESLint configuration with typescript-eslint setup
 * @param {Object} options Configuration options
 * @returns {Array} ESLint configuration array
 */
export function createBaseConfig(options = {}) {
  const {  gitignorePath } = options

  return [
    includeIgnoreFile(gitignorePath),
    globalIgnores(['eslint.config.mjs']),
      ...tseslint.config(
    tseslint.configs?.recommendedTypeChecked,
    {
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir: import.meta.dirname,
        },
      },
    },
      )
  ]
}
