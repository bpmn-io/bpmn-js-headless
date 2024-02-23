/* eslint-env node */

import fs from 'node:fs/promises';
import assert from 'node:assert';

import BpmnModeler from 'bpmn-js-headless/lib/Modeler';

import ZeebeModdle from 'zeebe-bpmn-moddle/resources/zeebe.json';
import ConditionElementTemplate from './condition-template.json';

import {
  CloudElementTemplatesCoreModule
} from 'bpmn-js-element-templates/core';

import CloudBehaviorsModule from 'camunda-bpmn-js-behaviors/lib/camunda-cloud/index.js';

async function run() {

  const diagramXML = await fs.readFile('./test/diagram.bpmn', 'utf8');

  const modeler = new BpmnModeler({
    additionalModules: [
      CloudBehaviorsModule,
      CloudElementTemplatesCoreModule
    ],
    moddleExtensions: {
      zeebe: ZeebeModdle
    },
    elementTemplates: [
      ConditionElementTemplate
    ]
  });

  const { warnings } = await modeler.importXML(diagramXML);

  assert.strictEqual(warnings.length, 0, 'no import warnings');

  modeler.invoke((elementRegistry, elementTemplates) => {

    const task = elementRegistry.get('Task_1');

    const conditionTemplate = elementTemplates.get('example.com.condition');

    return elementTemplates.applyTemplate(task, conditionTemplate);
  });

  const {
    xml
  } = await modeler.saveXML({ format: true });

  assert.match(
    xml,
    /<bpmn:task id="Task_1" name="foo" zeebe:modelerTemplate="example.com.condition" customProperty="nameProp=foo">/
  );

}

run().catch(err => {
  console.error(err);

  process.exit(1);
});