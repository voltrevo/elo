import * as preact from 'preact';

import DropDetector from './DropDetector';

export default class LabellingTool extends preact.Component {
  render() {
    this;

    return <>
      Labelling Tool

      <div style={{ position: 'relative', width: '100px', height: '100px' }}>
        <DropDetector onDrop={(f) => console.log('drop detected', f)}/>
        Test
      </div>
    </>;
  }
}
