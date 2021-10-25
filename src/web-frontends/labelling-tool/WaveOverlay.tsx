import * as preact from 'preact';

// import nil from '../../helpers/nil';

type Props = {
  currentTime: number;
  totalTime: number;
};

export default class WaveOverlay extends preact.Component<Props> {
  render() {
    return <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        class="wave-cursor"
        style={{ left: `${100 * (this.props.currentTime / this.props.totalTime)}%` }}
      />
    </div>;
  }
}
