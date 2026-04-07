import DrawModule from 'bpmn-js/lib/draw/index.js';

import TextRenderer from './TextRenderer.js';

/**
 * @type { import('didi').ModuleDeclaration }
 */
export default {
  __depends__: [ DrawModule ],
  textRenderer: [ 'type', TextRenderer ]
};
