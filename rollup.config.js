/* eslint-env node */

import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default [
  {
    input: './test/test.js',
    output: {
      file: './test/dist/test.js',
      format: 'commonjs'
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