import * as preact from 'preact';

type Props = {
  onAction: () => void;
};

export default class CollapseIcon extends preact.Component<Props, {}> {
  render() {
    return <div class="collapse-icon" onClick={this.props.onAction}>
      ‹
    </div>;
  }
}
