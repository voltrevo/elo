import * as preact from 'preact';

import nil from '../../helpers/nil';
import WaveForm from './WaveForm';
import WaveOverlay from './WaveOverlay';
import audioContext from './audioContext';
import TaskQueue from '../../helpers/TaskQueue';
import clamp from '../../helpers/clamp';
import renderTimeFromSeconds from './helpers/renderTimeFromSeconds';
import Label from './Label';
import DropDetector from './DropDetector';

type Props = {};

type State = {
  analysisAudioFile?: File,
  otherAudioFile?: File,
  labelsFile?: File,

  currentTime: number;
  audioBuffer?: AudioBuffer;
  audioData?: Float32Array;
  totalTime?: number;
  start: number;
  end?: number;
  hoverTime?: number;
  labels: Record<string, Label>;
};

export default class WavePlayer extends preact.Component<Props, State> {
  analysisAudioElement?: HTMLAudioElement;
  analysisAudioUrl?: string;
  otherAudioElement?: HTMLAudioElement;
  otherAudioUrl?: string;
  rafId?: number;

  timelineElement?: HTMLDivElement;

  cleanupTasks = new TaskQueue();

  constructor(props: {}) {
    super(props);

    this.state = {
      currentTime: 0,
      start: 0,
      labels: {},
    };
  }

  setAnalysisAudio = async (f: File) => {
    const audioBuffer = await audioContext.decodeAudioData(await f.arrayBuffer());

    if (this.analysisAudioUrl !== nil) {
      URL.revokeObjectURL(this.analysisAudioUrl);
    }

    this.analysisAudioUrl = URL.createObjectURL(f);
    this.analysisAudioElement!.src = this.analysisAudioUrl;

    this.setState({
      analysisAudioFile: f,
      audioBuffer,
      totalTime: audioBuffer.duration,
      end: audioBuffer.length,
      audioData: audioBuffer.getChannelData(0), // TODO: Mix channels
    });
  };

  setOtherAudio = async (f: File) => {
    if (this.otherAudioUrl !== nil) {
      URL.revokeObjectURL(this.otherAudioUrl);
    }

    this.otherAudioUrl = URL.createObjectURL(f);
    this.otherAudioElement!.src = this.otherAudioUrl;

    this.setState({
      otherAudioFile: f,
    });
  };

  setLabelsFile = async (f: File) => {
    const labelStr = new TextDecoder().decode(await f.arrayBuffer());
    const labelStrs = labelStr.split('\n').filter(line => line.trim() !== '');
    const labelTimes = labelStrs.map(Number);

    this.setState({
      labelsFile: f,
      labels: Object.fromEntries(labelTimes.map((t, i) => [`r${i}`, {
        type: 'reference',
        time: t,
      }])),
    });
  };

  async componentWillMount() {
    const analysisAudioElement = new Audio();
    this.analysisAudioElement = analysisAudioElement;

    analysisAudioElement.ontimeupdate = () => {
      this.setState({
        currentTime: analysisAudioElement.currentTime,
      });

      if (this.rafId !== nil) {
        cancelAnimationFrame(this.rafId);
      }

      if (!analysisAudioElement.paused) {
        requestAnimationFrame(() => this.animateCurrentTime({
          referenceTime: Date.now(),
          referenceCurrentTime: analysisAudioElement.currentTime,
        }));
      }
    };

    analysisAudioElement.onpause = () => {
      if (this.rafId !== nil) {
        cancelAnimationFrame(this.rafId);
      }
    };

    this.otherAudioElement = new Audio();

    window.addEventListener('mousemove', this.handleMouseMove);

    this.cleanupTasks.push(() => {
      window.removeEventListener('mousemove', this.handleMouseMove);
    });
  }

  componentWillUnmount() {
    this.pause();

    if (this.analysisAudioUrl !== nil) {
      URL.revokeObjectURL(this.analysisAudioUrl);
    }

    if (this.otherAudioUrl !== nil) {
      URL.revokeObjectURL(this.otherAudioUrl);
    }

    this.cleanupTasks.run(); // TODO: Use cleanup tasks only?
  }

  play = () => {
    this.analysisAudioElement?.play();
    this.otherAudioElement?.play();
  };

  pause = () => {
    this.analysisAudioElement?.pause();
    this.otherAudioElement?.pause();
  };

  animateCurrentTime(opt: {
    referenceTime: number,
    referenceCurrentTime: number,
  }) {
    this.setState({
      currentTime: opt.referenceCurrentTime + (Date.now() - opt.referenceTime) / 1000,
    });

    this.rafId = requestAnimationFrame(() => this.animateCurrentTime(opt));
  }

  calculateClientXTime = (clientX: number): number | nil => {
    if (this.timelineElement === nil || this.state.end === nil || this.state.audioBuffer === nil) {
      return nil;
    }

    const rect = this.timelineElement.getBoundingClientRect();

    const windowProgress = (clientX - rect.x) / rect.width;
    const samplePos = this.state.start + windowProgress * (this.state.end - this.state.start);

    return samplePos / this.state.audioBuffer.length * this.state.audioBuffer.duration;
  }

  handleTimelineClick = (evt: MouseEvent) => {
    const newTime = this.calculateClientXTime(evt.clientX);

    if (newTime === nil) {
      return;
    }

    if (this.analysisAudioElement) {
      this.analysisAudioElement.currentTime = newTime;
    }

    if (this.otherAudioElement) {
      this.otherAudioElement.currentTime = newTime;
    }
  };

  handleMouseMove = (evt: MouseEvent) => {
    const rect = this.timelineElement?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    if (!(
      (rect.left <= evt.clientX && evt.clientX <= rect.right) &&
      (rect.top <= evt.clientY && evt.clientY <= rect.bottom)
    )) {
      this.setState({ hoverTime: nil });
    } else {
      this.setState({
        hoverTime: this.calculateClientXTime(evt.clientX),
      });
    }
  };

  zoom(factor: number) {
    const {
      start, end, currentTime, totalTime, audioBuffer,
    } = this.state;

    if (end === nil || totalTime === nil || audioBuffer === nil) {
      return;
    }

    const current = currentTime / totalTime * audioBuffer.length;

    const newProps = {
      start: clamp(0, current + (start - current) / factor, audioBuffer.length),
      end: clamp(0, current + (end - current) / factor, audioBuffer.length),
    };

    this.setState(newProps);
  }

  moveLabel = (labelKey: string, clientX: number) => {
    const time = this.calculateClientXTime(clientX);

    if (time === nil) {
      return;
    }

    this.setState({
      labels: {
        ...this.state.labels,
        [labelKey]: { ...this.state.labels[labelKey], time },
      },
    });
  };

  render() {
    return <div class="wave-player">
      <div
        style={{ height: '300px', position: 'relative' }}
        onClick={this.handleTimelineClick}
        ref={r => { this.timelineElement = r ?? nil; }}
      >
        <div style={{ height: '33%' }}>
          {(() => {
            if (!this.state.audioData || this.state.end === nil) {
              return <>Loading</>;
            }

            return <WaveForm
              data={this.state.audioData}
              start={this.state.start}
              end={this.state.end}
            />;
          })()}
        </div>
        <div style={{
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          position: 'absolute',
        }}>
          {(() => {
            if (
              this.state.audioBuffer === nil ||
              this.state.end === nil ||
              this.state.totalTime === nil
            ) {
              return <>Loading</>;
            }

            return <WaveOverlay
              startTime={this.state.totalTime * this.state.start / this.state.audioBuffer.length}
              currentTime={this.state.currentTime}
              endTime={this.state.totalTime * this.state.end / this.state.audioBuffer.length}
              hoverTime={this.state.hoverTime}
              totalTime={this.state.totalTime}
              labels={this.state.labels}
              moveLabel={this.moveLabel}
            />;
          })()}
        </div>
      </div>
      <div>
        {renderTimeFromSeconds(this.state.currentTime)}
        &nbsp;/&nbsp;
        {renderTimeFromSeconds(this.state.totalTime ?? 0)}
      </div>
      <div>
        <button onClick={this.play}>
          Play
        </button>
        <button onClick={this.pause}>
          Pause
        </button>
        <button onClick={() => this.zoom(1.3)}>
          Zoom In
        </button>
        <button onClick={() => this.zoom(1 / 1.3)}>
          Zoom Out
        </button>
      </div>
      <div>
          <FileRequest name="analysis audio" onDrop={this.setAnalysisAudio}/>
          <FileRequest name="other audio" onDrop={this.setOtherAudio}/>
          <FileRequest name="labels" onDrop={this.setLabelsFile}/>
      </div>
    </div>;
  }
}

function FileRequest(props: { name: string, onDrop: (f: File) => void }) {
  return <div class="file-request">
    <DropDetector onDrop={props.onDrop}/>
    Drop {props.name} file here
  </div>;
}
