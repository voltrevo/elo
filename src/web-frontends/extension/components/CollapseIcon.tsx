import * as React from 'react';

type Props = {
  onAction: () => void;
};

export default class CollapseIcon extends React.Component<Props, {}> {
  render() {
    return <>
      <div className="hover-wing-left"/>
      <div className="slider-icon collapse-icon" onClick={this.props.onAction}>
        ‹
      </div>
    </>;
  }
}
