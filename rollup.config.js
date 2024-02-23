/* eslint-env node */

import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default [
  {
    input: './src/Modeler.js',
    output: {
      file: './lib/Modeler.cjs',
      format: 'commonjs'
    },
    plugins: pgl()
  },
  {
    input: './src/Modeler.js',
    output: {
      file: './lib/Modeler.js',
      format: 'esm'
    },
    plugins: pgl()
  },
  {
    input: './test/test.js',
    output: {
      file: './test/dist/test.js',
      format: 'esm'
    },
    plugins: pgl()
  }
];

function pgl(plugins = []) {
  return [
    nodeResolve(),
    commonjs(),
    json(),
    ...plugins
  ];
}