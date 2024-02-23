import BaseModeler from 'bpmn-js/lib/BaseModeler.js';

import CoreModule from 'bpmn-js/lib/core/index.js';
import TranslateModule from 'diagram-js/lib/i18n/translate/index.js';
import SelectionModule from 'diagram-js/lib/features/selection/index.js';

import AutoPlaceModule from 'bpmn-js/lib/features/auto-place/index.js';
import AutoResizeModule from 'bpmn-js/lib/features/auto-resize/index.js';
import CopyPasteModule from 'bpmn-js/lib/features/copy-paste/index.js';
import EditorActionsModule from 'bpmn-js/lib/features/editor-actions/index.js';
import ModelingModule from 'bpmn-js/lib/features/modeling/index.js';

import CoreOverrideModule from './overrides/diagram-js/lib/core/index.js';


/**
 * @typedef {import('bpmn-js/lib/BaseViewer').BaseViewerOptions} BaseViewerOptions
 *
 * @typedef {import('bpmn-js/model/Types').ModdleElement} ModdleElement
 */

/**
 * A headless modeler for BPMN 2.0 diagrams.
 *
 * @param {BaseViewerOptions} [options] The options to configure the modeler.
 */
export default function Modeler(options) {

  // derived from BaseViewer.js /////////

  /**
   * @type {BaseViewerOptions}
   */
  options = { ...options };

  /**
   * @type {Moddle}
   */
  this._moddle = this._createModdle(options);

  /**
   * @type {HTMLElement}
   */
  this._container = this._createContainer(options);

  this._init(this._container, this._moddle, options);

  // derived from BaseModeler.js //////////

  // hook ID collection into the modeler
  this.on('import.parse.complete', function(event) {
    if (!event.error) {
      this._collectIds(event.definitions, event.elementsById);
    }
  }, this);

  this.on('diagram.destroy', function() {
    this.get('moddle').ids.clear();
  }, this);
}

Modeler.prototype = Object.create(BaseModeler.prototype);

Modeler.prototype._createContainer = function() {
  return {};
};

Modeler.prototype.saveSVG = function() {
  throw new Error('not implemented in headless bpmn-js');
};

Modeler.prototype._interactionModules = [

];

Modeler.prototype._modelingModules = [
  AutoPlaceModule,
  AutoResizeModule,
  CopyPasteModule,
  ModelingModule,
  EditorActionsModule
];

// modules the viewer is composed of
Modeler.prototype._baseModules = [
  CoreModule,
  TranslateModule,
  SelectionModule
];

Modeler.prototype._overrideModules = [
  CoreOverrideModule
];

Modeler.prototype._modules = [].concat(
  Modeler.prototype._baseModules,
  Modeler.prototype._interactionModules,
  Modeler.prototype._modelingModules,
  Modeler.prototype._overrideModules
);