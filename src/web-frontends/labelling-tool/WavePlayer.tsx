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
import { download } from '../helpers/download';
import analyzeViaFetch from '../../analyzeViaFetch';
import type { AnalysisFragment } from '../../analyze';
import readLines from '../../helpers/readLines';

type Props = {};

type State = {
  mainAudioFile?: File,
  otherAudioFile?: File,
  labelsFile?: File,
  analysisFile?: File,
  analysis?: AnalysisFragment[],

  currentTime: number;
  loadingTime?: number;
  audioBuffer?: AudioBuffer;
  audioData?: Float32Array;
  totalTime?: number;
  start: number;
  end?: number;
  hoverTime?: number;
  labels: Record<string, Label>;
  words: { time: number, text: string }[];
};

export type Marker = {
  time: number;
  text: string;
};

export default class WavePlayer extends preact.Component<Props, State> {
  latestState: State = {
    currentTime: 0,
    start: 0,
    labels: {},
    words: [],
  };

  mainAudioElement?: HTMLAudioElement;
  mainAudioUrl?: string;
  otherAudioElement?: HTMLAudioElement;
  otherAudioUrl?: string;
  rafId?: number;

  timelineElement?: HTMLDivElement;

  blockInteractionsCounter = 0;

  cleanupTasks = new TaskQueue();

  constructor(props: {}) {
    super(props);

    this.state = this.latestState;
  }

  setState(updates: Partial<State>) {
    this.latestState = {
      ...this.latestState,
      ...updates,
    };

    super.setState(this.latestState);
  }

  setMainAudio = async (f: File) => {
    const audioBuffer = await audioContext.decodeAudioData(await f.arrayBuffer());

    if (this.mainAudioUrl !== nil) {
      URL.revokeObjectURL(this.mainAudioUrl);
    }

    this.mainAudioUrl = URL.createObjectURL(f);
    this.mainAudioElement!.src = this.mainAudioUrl;

    this.setState({
      mainAudioFile: f,
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
      labels: {
        ...Object.fromEntries(labelTimes.map((t, i) => [`r${i}`, {
          type: 'reference',
          time: t,
        }])),
        ...this.getLabels('generated'),
      },
    });
  };

  setAnalysisFile = async (f: File) => {
    this.clearAnalysis();

    readLines(f.stream(), () => {});

    this.clearAnalysis();

    this.setState({
      loadingTime: 0,
      analysisFile: f,
    });

    const analysis: AnalysisFragment[] = [];

    await readLines(
      f.stream(),
      line => {
        const fragment: AnalysisFragment = JSON.parse(line);
        console.log(fragment);
        analysis.push(fragment);
        this.addAnalysisFragment(fragment);
      },
    );

    this.setState({ analysis });
  }

  downloadAnalysis = () => {
    if (this.state.analysis === nil) {
      return;
    }

    const str = (this.state.analysis
      .map(fragment => JSON.stringify(fragment))
      .join('\n')
    );

    const url = URL.createObjectURL(new Blob([str]));
    download('analysis.jsonl', url);
    URL.revokeObjectURL(url);
  };

  async componentWillMount() {
    const mainAudioElement = new Audio();
    this.mainAudioElement = mainAudioElement;

    mainAudioElement.ontimeupdate = () => {
      this.setState({
        currentTime: mainAudioElement.currentTime,
      });

      if (this.rafId !== nil) {
        cancelAnimationFrame(this.rafId);
      }

      if (!mainAudioElement.paused) {
        requestAnimationFrame(() => this.animateCurrentTime({
          referenceTime: Date.now(),
          referenceCurrentTime: mainAudioElement.currentTime,
        }));
      }
    };

    mainAudioElement.onpause = () => {
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

    if (this.mainAudioUrl !== nil) {
      URL.revokeObjectURL(this.mainAudioUrl);
    }

    if (this.otherAudioUrl !== nil) {
      URL.revokeObjectURL(this.otherAudioUrl);
    }

    this.cleanupTasks.run(); // TODO: Use cleanup tasks only?
  }

  play = () => {
    this.mainAudioElement?.play();
    this.otherAudioElement?.play();
  };

  pause = () => {
    this.mainAudioElement?.pause();
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
    if (this.blockInteractionsCounter > 0 || evt.shiftKey) {
      return;
    }

    const newTime = this.calculateClientXTime(evt.clientX);

    if (newTime === nil) {
      return;
    }

    if (this.mainAudioElement) {
      this.mainAudioElement.currentTime = newTime;
    }

    if (this.otherAudioElement) {
      this.otherAudioElement.currentTime = newTime;
    }
  };

  handleTimelineMouseDown = (evt: MouseEvent) => {
    if (
      this.blockInteractionsCounter > 0 ||
      !evt.shiftKey ||
      this.state.end === nil ||
      this.state.audioBuffer === nil
    ) {
      return;
    }

    const audioBuffer = this.state.audioBuffer;

    const refWindow = {
      start: this.state.start,
      end: this.state.end,
    };

    const self = this;

    function onMouseMove(moveEvt: MouseEvent) {
      const mouseDownTime = self.calculateClientXTime(evt.clientX);
      const mouseMoveTime = self.calculateClientXTime(moveEvt.clientX);

      if (mouseDownTime === nil || mouseMoveTime === nil) {
        return;
      }

      const moveSampleDiff = (
        (mouseMoveTime - mouseDownTime!) *
        (audioBuffer.length / audioBuffer.duration)
      );

      self.setState({
        start: refWindow.start - moveSampleDiff,
        end: refWindow.end - moveSampleDiff,
      });
    }

    function onMouseUp() {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
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

  addLabel = () => {
    this.setState({
      labels: {
        ...this.state.labels,
        [`r${Math.random()}`]: {
          type: 'reference',
          time: this.state.currentTime,
        },
      },
    });
  };

  removeLabel = () => {
    let closestLabelDiff: number | nil = nil;
    let closestLabelKey: string | nil = nil;

    for (const [labelKey, label] of Object.entries(this.state.labels)) {
      if (label.type !== 'reference') {
        continue;
      }

      const labelDiff = Math.abs(label.time - this.state.currentTime);

      if (closestLabelDiff === nil || labelDiff < closestLabelDiff) {
        closestLabelDiff = labelDiff;
        closestLabelKey = labelKey;
      }
    }

    if (closestLabelDiff === nil || closestLabelDiff > 3) {
      return; // Ignore if closest label is more than 3 seconds away
    }

    if (closestLabelKey !== nil) {
      const newLabels = { ...this.latestState.labels };
      delete newLabels[closestLabelKey];

      this.setState({
        labels: newLabels,
      });
    }
  };

  clearAnalysis() {
    this.setState({
      words: [],
      labels: this.getLabels('reference'),
      analysisFile: nil,
      analysis: nil,
    });
  }

  analyze = async () => {
    if (this.state.mainAudioFile === nil) {
      return;
    }

    this.clearAnalysis();

    this.setState({ loadingTime: 0 });

    const analysis: AnalysisFragment[] = [];

    await analyzeViaFetch(
      '/analyze',
      this.state.mainAudioFile,
      fragment => {
        console.log(fragment);
        analysis.push(fragment);
        this.addAnalysisFragment(fragment);
      },
    );

    this.setState({ analysis });
  };

  addAnalysisFragment(fragment: AnalysisFragment) {
    if (
      fragment.type === 'disfluent' &&
      fragment.value.category === 'filler' &&
      fragment.value.end_time !== null
    ) {
      this.setState({
        labels: {
          ...this.latestState.labels,
          [`g${Math.random()}`]: {
            type: 'generated',
            time: fragment.value.end_time,
            data: fragment.value,
          },
        },
      });
    }

    if (fragment.type === 'word' && fragment.value.end_time !== null) {
      this.setState({
        words: [
          ...this.latestState.words,
          { time: fragment.value.end_time, text: fragment.value.text },
        ],
      });
    }

    if (fragment.type === 'progress') {
      this.setState({
        loadingTime: fragment.value.duration,
      });
    }

    if (fragment.type === 'end') {
      this.setState({
        loadingTime: nil,
      });
    }
  }

  downloadLabels = () => {
    const str = Object.values(this.state.labels)
      .filter(label => label.type === 'reference')
      .map(label => `${label.time}`)
      .join('\n');

    const url = URL.createObjectURL(new Blob([str]));
    download('labels.txt', url);
    URL.revokeObjectURL(url);
  };

  getLabels(type: Label['type']) {
    return Object.fromEntries(
      Object.entries(this.state.labels).filter(([, label]) => label.type === type),
    );
  }

  calculateMarks() {
    const matches: { reference: Label, generated: Label }[] = [];

    const referenceLabels = this.getLabels('reference');
    const generatedLabels = this.getLabels('generated');

    for (const [referenceKey, referenceLabel] of Object.entries(referenceLabels)) {
      let bestMatch: { key: string, timeDiff: number } | nil = nil;

      for (const [generatedKey, generatedLabel] of Object.entries(generatedLabels)) {
        const timeDiff = generatedLabel.time - referenceLabel.time;

        if (bestMatch === nil || Math.abs(timeDiff) < Math.abs(bestMatch.timeDiff)) {
          bestMatch = { key: generatedKey, timeDiff };
        }
      }

      if (bestMatch !== nil && Math.abs(bestMatch.timeDiff) <= 1) {
        matches.push({
          reference: referenceLabel,
          generated: generatedLabels[bestMatch.key],
        });

        delete referenceLabels[referenceKey];
        delete generatedLabels[bestMatch.key];
      }
    }

    const markers: Marker[] = [
      ...matches.map(match => ({
        time: match.generated.time,
        text: '✅',
      })),
      ...Object.values(referenceLabels).map(label => ({
        time: label.time,
        text: '❌',
      })),
      ...Object.values(generatedLabels).map(label => ({
        time: label.time,
        text: '❌',
      })),
    ];

    return {
      markers,
      correct: matches.length,
      total: markers.length,
      falsePositives: Object.keys(generatedLabels).length,
      falseNegatives: Object.keys(referenceLabels).length,
    };
  }

  render() {
    const marks = this.calculateMarks();

    return <div class="wave-player">
      <div
        style={{ height: '300px', position: 'relative' }}
        onClick={this.handleTimelineClick}
        onMouseDown={this.handleTimelineMouseDown}
        ref={r => { this.timelineElement = r ?? nil; }}
      >
        <div style={{ height: '33%' }}>
          {(() => {
            if (!this.state.audioData || this.state.end === nil) {
              return <>Waiting for audio data</>;
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
              return <></>;
            }

            return <WaveOverlay
              startTime={this.state.totalTime * this.state.start / this.state.audioBuffer.length}
              currentTime={this.state.currentTime}
              endTime={this.state.totalTime * this.state.end / this.state.audioBuffer.length}
              hoverTime={this.state.hoverTime}
              loadingTime={this.state.loadingTime}
              totalTime={this.state.totalTime}
              labels={this.state.labels}
              moveLabel={this.moveLabel}
              blockParentInteractions={() => this.blockInteractionsCounter++}
              unblockParentInteractions={() => this.blockInteractionsCounter--}
              markers={marks.markers}
              words={this.state.words}
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
        Accuracy: {Math.round(100 * marks.correct / marks.total)}%
        &nbsp;({marks.correct}/{marks.total})
      </div>
      <div class="tool-row">
        <button onClick={this.play}>
          Play
        </button>
        <button onClick={this.pause}>
          Pause
        </button>
        &nbsp;
        <button onClick={() => this.zoom(1.3)}>
          Zoom In
        </button>
        <button onClick={() => this.zoom(1 / 1.3)}>
          Zoom Out
        </button>
        &nbsp;
        <button onClick={this.addLabel}>Add label</button>
        <button onClick={this.removeLabel}>Remove label</button>
      </div>
      <table class="files-table">
        <thead></thead>
        <tbody>
          <tr>
            <td>Main Audio</td>
            <td>
              <FileRequest onDrop={this.setMainAudio}>Drop File</FileRequest>
            </td>
            <td>
              {this.state.mainAudioFile?.name}
            </td>
          </tr>
          <tr>
            <td>Other Audio</td>
            <td>
              <FileRequest onDrop={this.setOtherAudio}>Drop File</FileRequest>
            </td>
            <td>
              {this.state.otherAudioFile?.name}
            </td>
          </tr>
          <tr>
            <td>Reference Labels</td>
            <td>
              <FileRequest onDrop={this.setLabelsFile}>Drop File</FileRequest>
            </td>
            <td>
              {this.state.labelsFile?.name}
            </td>
            <td>
              <button onClick={this.downloadLabels}>Download</button>
            </td>
          </tr>
          <tr>
            <td>Analysis</td>
            <td>
              <FileRequest onDrop={this.setAnalysisFile}>Drop File</FileRequest>
            </td>
            <td>
              {this.state.analysisFile?.name}
            </td>
            <td>
              <button
                disabled={this.state.loadingTime !== nil}
                onClick={this.analyze}
              >
                {this.state.loadingTime === nil ? 'Analyze' : 'Analyzing...'}
              </button>
            </td>
            <td>
              <button onClick={this.downloadAnalysis}>Download</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>;
  }
}

function FileRequest(props: { onDrop: (f: File) => void, children?: preact.ComponentChildren }) {
  return <div class="file-request">
    <DropDetector onDrop={props.onDrop}/>
    {props.children}
  </div>;
}
