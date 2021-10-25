import * as preact from 'preact';

import WavePlayer from './WavePlayer';

type State = {};

export default class LabellingTool extends preact.Component<{}, State> {
  render() {
    this;
    return <WavePlayer/>;
  }
}
