import * as preact from 'preact';

import nil from '../../helpers/nil';
import renderTimeFromSeconds from './helpers/renderTimeFromSeconds';
import Label from './Label';
import LabelComponent from './LabelComponent';

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
};

export default class WaveOverlay extends preact.Component<Props> {
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
        class="wave-cursor"
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
            class="wave-cursor faded"
            style={{ left: `${100 * progressOf(hoverTime)}%` }}
          />
          <div
            class="wave-cursor-time"
            style={textStyle}
          >{renderTimeFromSeconds(hoverTime)}</div>
        </>;
      })()}
      {(() => {
        if (loadingTime === nil) {
          return <></>;
        }

        return <div
          class="wave-cursor loading"
          style={{ left: `${100 * progressOf(loadingTime)}%` }}
        />;
      })()}
      {(() => Object.entries(this.props.labels).map(([labelKey, label]) => (
        <LabelComponent
          label={label}
          left={`${100 * progressOf(label.time)}%`}
          move={clientX => this.props.moveLabel(labelKey, clientX)}
          onDragStart={this.props.blockParentInteractions}
          onDragEnd={this.props.unblockParentInteractions}
        />
      )))()}
    </div>;
  }
}
