import * as preact from 'preact';

type Props = {
  onAction: () => void;
};

export default class ExpandIcon extends preact.Component<Props, {}> {
  render() {
    return <>
      <div class="hover-wing-right"/>
      <div class="slider-icon expand-icon" onClick={this.props.onAction}>
        ›
      </div>
    </>;
  }
}
