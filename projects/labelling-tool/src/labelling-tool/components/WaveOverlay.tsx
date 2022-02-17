import * as React from 'react';

import clamp from '../../common-pure/clamp';
import nil from '../../common-pure/nil';
import renderTimeFromSeconds from '../helpers/renderTimeFromSeconds';
import Label from '../Label';
import LabelComponent from './LabelComponent';
import type { Marker } from './WavePlayer';

type Props = {
  startTime: number;
  currentTime: number;
  loadingTime?: number;
  endTime: number;
  hoverTime?: number;
  totalTime?: number;
  labels: Record<string, Label>;
  moveLabel: (labelKey: string, clientX: number) => void;
  blockParentInteractions: () => void;
  unblockParentInteractions: () => void;
  markers: Marker[];
  words: { time: number, text: string }[];
};

export default class WaveOverlay extends React.Component<Props> {
  render() {
    const {
      startTime, currentTime, loadingTime, endTime, hoverTime, totalTime,
    } = this.props;

    if (totalTime === nil) {
      return <>Loading</>;
    }

    function progressOf(time: number) {
      return (time - startTime) / (endTime - startTime);
    }

    return <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        className="wave-cursor"
        style={{ left: `${100 * progressOf(currentTime)}%` }}
      />
      {(() => {
        if (hoverTime === nil) {
          return <></>;
        }

        const progress = progressOf(hoverTime);

        if (progress < 0 || progress > 1) {
          return <></>;
        }

        const textStyle = (progress < 0.8
          ? { left: `${100 * progressOf(hoverTime)}%` }
          : { right: `${100 * (1 - progressOf(hoverTime))}%` }
        );

        return <>
          <div
            className="wave-cursor faded"
            style={{ left: `${100 * progressOf(hoverTime)}%` }}
          />
          <div
            className="wave-cursor-time"
            style={textStyle}
          >{renderTimeFromSeconds(hoverTime)}</div>
        </>;
      })()}
      {(() => {
        if (loadingTime === nil) {
          return <></>;
        }

        return <div
          className="wave-cursor loading"
          style={{ left: `${100 * progressOf(loadingTime)}%` }}
        />;
      })()}
      {Object.entries(this.props.labels).map(([labelKey, label]) => {
        const progress = progressOf(label.time);

        if (progress !== clamp(0, progress, 1)) {
          return <></>;
        }

        return <LabelComponent
          key={labelKey}
          label={label}
          left={`${100 * progress}%`}
          move={clientX => this.props.moveLabel(labelKey, clientX)}
          onDragStart={this.props.blockParentInteractions}
          onDragEnd={this.props.unblockParentInteractions}
        />;
      })}
      {this.props.markers.map(marker => {
        const progress = progressOf(marker.time);

        if (progress !== clamp(0, progress, 1)) {
          return <></>;
        }

        return <div className="marker" style={{ left: `${100 * progress}%` }}>
          {marker.text}
        </div>;
      })}
      {this.props.words.map(word => {
        const progress = progressOf(word.time);

        if (progress !== clamp(0, progress, 1)) {
          return <></>;
        }

        return <div
          className="word"
          style={{ right: `${100 * (1 - progress)}%` }}
        >
          {word.text}
        </div>;
      })}
    </div>;
  }
}
