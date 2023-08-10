# bpmn-js-headless

Run [bpmn-js](https://github.com/bpmn-io/bpmn-js) in headless environments.


## Usage

Use just like [bpmn-js](https://github.com/bpmn-io/bpmn-js), but be sure not to use interactive (extension) modules.

```javascript
import Modeler from 'bpmn-js-headless/lib/Modeler';

const modeler = new BpmnModeler();

// import diagram
await modeler.importXML(myDiagram);

// perform a change operation
modeler.invoke((modeling, elementRegistry) => {

  const participant = elementRegistry.get('Participant_1');

  modeling.removeElements([ participant ]);
});

// export diagram
const {
  xml
} = await modeler.saveXML({ format: true });
```


## Why?

This utility is useful whenever you want to apply complex modeling operations in headless (aka no browser) environments. Some examples:

* Apply [element templates](https://github.com/bpmn-io/element-templates)
* Build BPMN diagrams [programmatically](https://github.com/nikku/bpmn-js-cli-modeling-dsl)


## How does it work

* Uses only bpmn-js modules that are safe for headless execution
* Overrides core [diagram-js](https://github.com/bpmn-io/diagram-js) components to be independent of graphical representation


## Caveats

This is a truely headless version of bpmn-js, i.e. it does not fake a browser environment. For extensions to be compatible they shall enforce a proper UI / behavior separation, and not rely on browser features.

You want to bundle this library along with extensions, as [bpmn-js](https://github.com/bpmn-io/bpmn-js) and dependent libraries require bundling, too.