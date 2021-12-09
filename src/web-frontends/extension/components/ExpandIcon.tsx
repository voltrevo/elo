import * as preact from 'preact';

type Props = {
  onAction: () => void;
};

export default class ExpandIcon extends preact.Component<Props, {}> {
  render() {
    return <div class="expand-icon" onClick={this.props.onAction}>
      ›
    </div>;
  }
}
