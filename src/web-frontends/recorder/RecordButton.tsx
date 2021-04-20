import * as preact from 'preact';

type Props = Readonly<{
  active: boolean,
  onClick?: () => void,
}>;

export default class RecordButton extends preact.Component<Props> {
  render() {
    return <div
      class={`record-btn${this.props.active ? ' active' : ''}`}
      style={{ position: 'relative' }} onClick={this.props.onClick}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        class="record-btn-outer"
      >
        <div class="record-btn-inner"></div>
      </div>
    </div>;
  }
}
