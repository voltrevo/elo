import * as preact from 'preact';

// import LabellingTool from './LabellingTool';
import WaveForm from './WaveForm';

window.addEventListener('load', () => {
  preact.render(<WaveForm/>, document.body);
});
