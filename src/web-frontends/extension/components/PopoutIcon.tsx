import * as preact from 'preact';

type Props = {
  onAction: () => void;
};

export default class PopoutIcon extends preact.Component<Props, {}> {
  render() {
    return <div class="popout-icon" onClick={this.props.onAction}>
      ↗
    </div>;
  }
}
