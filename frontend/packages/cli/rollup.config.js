import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import execute from 'rollup-plugin-execute'
import { swc } from 'rollup-plugin-swc3'

// This file is for building the CLI entry point.

export default {
  input: 'bin/cli.ts',
  output: {
    file: 'dist-cli/bin/cli.js',
    format: 'esm',
  },
  plugins: [
    resolve({
      preferBuiltins: true,
      extensions: ['.mjs', '.js', '.json', '.node', '.ts'],
    }),
    swc({
      jsc: {
        parser: {
          syntax: 'typescript',
        },
        target: 'es2022',
      },
    }),
    execute('chmod +x dist-cli/bin/cli.js'),
    commonjs(),
  ],
  external: [
    'commander',
    'inquirer',
    '@prisma/internals',
    'glob',
    '@swc/core',
    'ink',
  ],
}
