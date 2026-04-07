import fs from 'node:fs/promises';
import assert from 'node:assert';

import BpmnModeler from 'bpmn-js-headless/lib/Modeler';
import TextRenderer from '../src/overrides/bpmn-js/lib/draw/TextRenderer.js';

import ZeebeModdle from 'zeebe-bpmn-moddle/resources/zeebe.json';
import ConditionElementTemplate from './condition-template.json';

import {
  CloudElementTemplatesCoreModule
} from 'bpmn-js-element-templates/core';

import CloudBehaviorsModule from 'camunda-bpmn-js-behaviors/lib/camunda-cloud/index.js';

// unit tests: TextRenderer dimension estimation
{
  const renderer = new TextRenderer();
  const bounds = { x: 0, y: 0, width: 150, height: 50 };

  // hyphen is measured as a character, not a word separator
  {
    const hyphenated = renderer.getExternalLabelBounds(bounds, 'foo-bar'); // 7 chars
    const plain = renderer.getExternalLabelBounds(bounds, 'fooXbar'); // 7 chars

    assert.equal(hyphenated.width, plain.width, 'hyphen should not add phantom inter-word spacing');
  }

  // empty text produces one line of positive height and zero width
  {
    const empty = renderer.getExternalLabelBounds(bounds, '');

    assert.equal(empty.width, 0, 'empty text has zero width');
    assert.ok(empty.height > 0, 'empty text reserves one line of height');
  }

  // width grows monotonically with character count
  {
    const short = renderer.getExternalLabelBounds(bounds, 'ab');
    const longer = renderer.getExternalLabelBounds(bounds, 'abcdef');

    assert.ok(longer.width > short.width, 'longer text is wider');
  }

  // explicit newline adds a line
  {
    const oneLine = renderer.getExternalLabelBounds(bounds, 'hello');
    const twoLines = renderer.getExternalLabelBounds(bounds, 'hello\nworld');

    assert.ok(twoLines.height > oneLine.height, 'newline increases height');
  }

  // long text wraps within the (fixed 90px) external label box
  {
    const wrapped = renderer.getExternalLabelBounds(bounds, 'one two three four five six');
    const single = renderer.getExternalLabelBounds(bounds, 'one');

    assert.ok(wrapped.height > single.height, 'long text wraps to multiple lines');
  }

  // leading/trailing whitespace does not change measured width
  {
    const trimmed = renderer.getExternalLabelBounds(bounds, 'hello');
    const padded = renderer.getExternalLabelBounds(bounds, '   hello   ');

    assert.equal(padded.width, trimmed.width, 'whitespace-only padding is ignored');
  }
}


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


  // test 1: apply element template
  const task = modeler.invoke((elementRegistry, elementTemplates) => {

    const task = elementRegistry.get('Task_1');

    const conditionTemplate = elementTemplates.get('example.com.condition');

    return elementTemplates.applyTemplate(task, conditionTemplate);
  });

  // then
  assert.ok(task);
  assert.equal(
    task.businessObject.get('zeebe:modelerTemplate'),
    'example.com.condition'
  );


  // test 2: model something
  const connection = modeler.invoke((canvas, elementFactory, modeling) => {

    const parent = canvas.getRootElement();

    const shape1 = modeling.createShape(
      elementFactory.createShape({ type: 'bpmn:UserTask' }),
      {
        x: 300,
        y: 300
      },
      parent
    );

    const shape2 = modeling.createShape(
      elementFactory.createShape({ type: 'bpmn:UserTask' }),
      {
        x: 500,
        y: 300
      },
      parent
    );

    return modeling.connect(shape1, shape2);
  });

  // then
  assert.ok(connection);
  assert.equal(connection.type, 'bpmn:SequenceFlow');


  // test 3: serialize with template
  const {
    xml
  } = await modeler.saveXML({ format: true });

  assert.match(
    xml,
    /<bpmn:task id="Task_1" name="foo" zeebe:modelerTemplate="example.com.condition" customProperty="nameProp=foo">/
  );


  // test 4: update external label
  modeler.invoke((elementRegistry, modeling) => {

    const event = elementRegistry.get('StartEvent_1');

    // when
    modeling.updateProperties(event, { name: 'newName' });

    // then
    assert.equal(event.businessObject.name, 'newName');
    assert.ok(event.label, 'label shape exists');
    assert.ok(event.label.width > 0, 'label has a computed width');
    assert.ok(event.label.height > 0, 'label has a computed height');
  });


  // test 5: use selection, and trigger editor action
  modeler.invoke((selection, elementRegistry, editorActions) => {

    // given
    const taskElement = elementRegistry.get('Task_1');

    // assume
    assert.deepEqual(selection.get(), []);

    // when
    selection.select(taskElement);

    // then
    assert.deepEqual(selection.get(), [ taskElement ]);

    // when
    editorActions.trigger('removeSelection');

    // then
    assert.deepEqual(selection.get(), []);
    assert.deepEqual(elementRegistry.get('Task_1'), null);
  });
}

run().catch(err => {
  console.error(err);

  process.exit(1);
});