import BaseCoreModule from 'diagram-js/lib/core/index.js';

import GraphicsFactory from './GraphicsFactory.js';
import Canvas from './Canvas.js';
import ElementRegistry from './ElementRegistry.js';

/**
 * @type { import('didi').ModuleDeclaration }
 */
export default {
  __depends__: [ BaseCoreModule ],
  __init__: [ 'canvas' ],
  canvas: [ 'type', Canvas ],
  graphicsFactory: [ 'type', GraphicsFactory ],
  elementRegistry: [ 'type', ElementRegistry ]
};