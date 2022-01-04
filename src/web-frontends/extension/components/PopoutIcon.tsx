import * as preact from 'preact';

import EloUrl from '../helpers/EloUrl';

type Props = {
  onAction: () => void;
};

export default class PopoutIcon extends preact.Component<Props, {}> {
  render() {
    return <>
      <div class="hover-wing-right"/>
      <div class="slider-icon popout-icon" onClick={this.props.onAction} style={{
        backgroundImage: `url(${EloUrl('assets/trend-arrow.svg')})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}>&nbsp;</div>
    </>;
  }
}
