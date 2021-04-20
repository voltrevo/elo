import * as preact from 'preact';

type Props = {
  class?: string,
  onClick?: () => void,
};

export default class FlexVertCenter extends preact.Component<Props> {
  render() {
    return <div
      class={this.props.class}
      onClick={this.props.onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: '1',
      }}
    >
      <div style={{ flexGrow: '1' }}></div>
      <div>{this.props.children}</div>
      <div style={{ flexGrow: '1' }}></div>
    </div>;
  }
}
