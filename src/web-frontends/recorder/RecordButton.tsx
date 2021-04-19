import * as preact from 'preact';

type Props = Readonly<{
  active: boolean,
}>;

export default class RecordButton extends preact.Component<Props> {
  render() {
    return <div class={`clickable record-btn${this.props.active ? ' active' : ''}`}></div>;
  }
}
