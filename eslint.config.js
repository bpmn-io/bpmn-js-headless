import bpmnIoPlugin from 'eslint-plugin-bpmn-io';

const files = {
  src: [
    'src/**/*.js'
  ],
  test: [
    'test/**/*.{js,mjs}'
  ],
  ignored: [
    'lib',
    'test/dist'
  ]
};

export default [
  {
    'ignores': files.ignored
  },

  // lib
  ...bpmnIoPlugin.configs.recommended.map(config => {

    return {
      ...config,
      files: files.src
    };
  }),

  // build + test
  ...bpmnIoPlugin.configs.node.map(config => {

    return {
      ...config,
      ignores: files.src
    };
  }),

  // test
  ...bpmnIoPlugin.configs.mocha.map(config => {

    return {
      ...config,
      files: files.test
    };
  })
];
