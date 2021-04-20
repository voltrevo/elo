import * as preact from 'preact';

type Props = Readonly<{
  active: boolean,
  onClick?: () => void,
}>;

export default class RecordButton extends preact.Component<Props> {
  render() {
    return <div
      class={`record-btn${this.props.active ? ' active' : ''}`}
      onClick={this.props.onClick}
    >
      <div class="record-btn-inner"></div>
    </div>;
  }
}
