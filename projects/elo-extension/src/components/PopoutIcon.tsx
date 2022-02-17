import * as React from 'react';

import EloUrl from '../helpers/EloUrl';

type Props = {
  onAction: () => void;
};

export default class PopoutIcon extends React.Component<Props, {}> {
  render() {
    return <>
      <div className="hover-wing-right"/>
      <div className="slider-icon popout-icon" onClick={this.props.onAction} style={{
        backgroundImage: `url(${EloUrl('assets/trend-arrow.svg')})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}>&nbsp;</div>
    </>;
  }
}
