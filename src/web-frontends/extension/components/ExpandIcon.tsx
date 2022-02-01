import * as React from 'react';

type Props = {
  onAction: () => void;
};

export default class ExpandIcon extends React.Component<Props, {}> {
  render() {
    return <>
      <div className="hover-wing-right"/>
      <div className="slider-icon expand-icon" onClick={this.props.onAction}>
        ›
      </div>
    </>;
  }
}
