import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import execute from 'rollup-plugin-execute'
import json from '@rollup/plugin-json';


// This file is for building the CLI entry point.

export default {
  input: 'bin/cli.ts',
  output: {
    dir: 'dist-cli/bin',
    format: 'esm',
  },
  plugins: [
    resolve({
      preferBuiltins: true,
      extensions: ['.mjs', '.js', '.json', '.node', '.ts'],
    }),
    typescript({
      outputToFilesystem: true,
      tsconfig: './tsconfig.node.json',
    }),
    execute('chmod +x dist-cli/bin/cli.js'),
    commonjs(),
    json(),
  ],
  external: ['commander', '@prisma/internals'],
}
