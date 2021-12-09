import * as preact from 'preact';

type Props = {
  onAction: () => void;
};

export default class CollapseIcon extends preact.Component<Props, {}> {
  render() {
    return <>
      <div class="hover-wing-left"/>
      <div class="slider-icon collapse-icon" onClick={this.props.onAction}>
        ‹
      </div>
    </>;
  }
}
