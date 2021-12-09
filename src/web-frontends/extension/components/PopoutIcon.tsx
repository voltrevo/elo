import * as preact from 'preact';

type Props = {
  onAction: () => void;
};

export default class PopoutIcon extends preact.Component<Props, {}> {
  render() {
    return <>
      <div class="hover-wing-right"/>
      <div class="slider-icon popout-icon" onClick={this.props.onAction}>
        ↗
      </div>
    </>;
  }
}
