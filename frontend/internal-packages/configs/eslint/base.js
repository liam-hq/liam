import cssModulesKit from "@css-modules-kit/eslint-plugin";
import { includeIgnoreFile } from "@eslint/compat";
import css from "@eslint/css";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import unicorn from "eslint-plugin-unicorn";
import { noNonEnglishPlugin } from "./no-non-english-plugin.js";
import { noThrowErrorPlugin } from "./no-throw-error-plugin.js";
import { preferClsxPlugin } from "./prefer-clsx-plugin.js";
import { requireUseServerPlugin } from "./require-use-server-plugin.js";

/**
 * Base ESLint configuration with typescript-eslint setup
 * @param {Object} options Configuration options
 * @param {string} options.tsconfigPath Path to tsconfig.json file
 * @returns {Array} ESLint configuration array
 */
export function createBaseConfig(options = {}) {
	const { tsconfigPath = "./tsconfig.json", gitignorePath } = options;

	return [
		includeIgnoreFile(gitignorePath),
		{
			files: ["**/*.ts", "**/*.tsx"],
			ignores: [
				"**/trigger.config.ts",
				"**/vitest.config.ts",
				"**/dist/**",
				"**/.trigger/**",
				"**/app/.well-known/**",
			],
			plugins: {
				"@typescript-eslint": tseslint,
				unicorn: unicorn,
				"require-use-server": requireUseServerPlugin,
				"no-non-english": noNonEnglishPlugin,
				"no-throw-error": noThrowErrorPlugin,
				"prefer-clsx": preferClsxPlugin,
			},
			languageOptions: {
				parser: tsParser,
				parserOptions: {
					projectService: tsconfigPath,
					ecmaVersion: 2022,
					sourceType: "module",
				},
			},
			rules: {
				"@typescript-eslint/no-unsafe-member-access": "error",
				"@typescript-eslint/consistent-type-assertions": [
					"error",
					{
						assertionStyle: "never",
					},
				],
				"@typescript-eslint/consistent-type-definitions": ["error", "type"],
				"require-use-server/require-use-server": "error",
				"no-non-english/no-non-english-characters": "error",
				"no-throw-error/no-throw-error": "error",
				"prefer-clsx/prefer-clsx-for-classnames": "error",
				"unicorn/filename-case": [
					"error",
					{
						cases: {
							camelCase: true,
							pascalCase: true,
						},
						ignore: [
							"^global-error\\.(tsx?)$",
							"^instrumentation-client\\.(ts)$",
							"^\\..*",
							"README\\.md$",
						],
					},
				],
				"no-restricted-exports": [
					"error",
					{
						restrictedNamedExports: ["*"],
					},
				],
				"no-restricted-imports": [
					"error",
					{
						paths: [
							{
								name: "neverthrow",
								message: "Import from @liam-hq/neverthrow instead",
							},
						],
					},
				],
				"no-restricted-syntax": [
					"error",
					{
						selector: "ExportNamedDeclaration[source]",
						message: "Re-exports are not allowed except in index.ts files",
					},
				],
			},
		},
		{
			files: ["index.ts", "**/index.ts"],
			rules: {
				"no-restricted-exports": "off",
				"no-restricted-syntax": "off",
			},
		},
		{
			files: ["**/DropdownMenu/DropdownMenu.tsx", "**/parser.ts"],
			rules: {
				"no-restricted-syntax": "off",
			},
		},
		{
			files: ["**/trigger.config.ts", "**/vitest.config.ts"],
			plugins: {
				"@typescript-eslint": tseslint,
				"no-non-english": noNonEnglishPlugin,
				"no-throw-error": noThrowErrorPlugin,
			},
			languageOptions: {
				parser: tsParser,
				parserOptions: {
					ecmaVersion: 2022,
					sourceType: "module",
				},
			},
			rules: {
				"no-non-english/no-non-english-characters": "error",
				"no-throw-error/no-throw-error": "error",
			},
		},
		{
			files: ["**/*.css"],
			language: "css/css",
			plugins: {
				css,
				"css-modules-kit": cssModulesKit,
			},
			rules: {
				"css-modules-kit/no-unused-class-names": "error",
			},
		},
	];
}
