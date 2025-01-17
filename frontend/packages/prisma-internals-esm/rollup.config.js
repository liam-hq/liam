import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';

export default {
  input: 'src/index.js',
  output: {
    dir: 'dist',
    format: 'esm',
    entryFileNames: '[name].mjs'
  },
  plugins: [
    nodeResolve({
      preferBuiltins: true
    }),
    commonjs(),
    json(),
    {
      name: 'mock-fs-plugin',
      resolveId(source) {
        if (source === 'fs') {
          return 'virtual:fs';
        }
        return null;
      },
      load(id) {
        if (id === 'virtual:fs') {
          return 'export default {};';
        }
        return null;
      },
    }
  ],
  external: [
    'fs',
    'path',
    'crypto',
    'util',
    'os',
    'child_process',
    '@prisma/internals'
  ]
};
