import resolve from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'
import typescript from '@rollup/plugin-typescript'
import execute from 'rollup-plugin-execute'

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
    json(),
    typescript({
      outputToFilesystem: true,
      tsconfig: './tsconfig.node.json',
    }),
    execute('chmod +x dist-cli/bin/cli.js'),
  ],
  external: ['commander'],
}
