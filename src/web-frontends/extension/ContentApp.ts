import { AnalysisDisfluent, AnalysisFragment } from "../../analyze";
import never from "../../helpers/never";
import TaskQueue from "../../helpers/TaskQueue";
import EwmaCalculator from "../helpers/EwmaCalculator";
import Protocol, { ConnectionEvent, PromisishApi } from "./Protocol";
import UiState from "./UiState";

type SessionStats = {
  speakingTime: number;
  totalTime: number;
  featureCounts: Record<string, Record<string, number>>;
};

export default class ContentApp implements PromisishApi<Protocol> {
  uiState: UiState = {
    index: 0,

    active: false,
    loading: false,

    fillerSoundBox: {
      text: '',
      metric: '0.0',
    },

    fillerWordBox: {
      text: '',
      metric: '0.0',
    },
  };

  sessionStats: SessionStats = {
    speakingTime: 0,
    totalTime: 0,
    featureCounts: {},
  };

  uiStateRequests = new TaskQueue();

  fillerSoundEwma = new EwmaCalculator(60, 60);
  fillerWordEwma = new EwmaCalculator(60, 60);

  updateUi() {
    this.uiState.index++;
    this.uiStateRequests.run();
  }

  notifyGetUserMediaCalled() {
    if (this.uiState.active) {
      return;
    }

    this.uiState.active = true;
    this.updateUi();
  }

  addFragment(fragment: AnalysisFragment) {
    switch (fragment.type) {
      case 'word': {
        this.uiState.word = fragment.value.text;
        this.updateUi();

        break;
      }

      case 'disfluent': {
        this.updateFeatureCount(fragment.value);

        if (fragment.value.category === 'filler') {
          this.uiState.fillerSoundBox.text = fragment.value.text;
          this.fillerSoundEwma.observe(1);
        } else {
          this.uiState.fillerWordBox.text = fragment.value.text;
          this.fillerWordEwma.observe(1);
        }

        this.updateMetrics();

        break;
      }

      case 'progress': {
        this.fillerSoundEwma.timeDecay(fragment.value.speaking_time);
        this.fillerWordEwma.timeDecay(fragment.value.speaking_time);
        this.updateMetrics();

        break;
      }

      case 'token':
      case 'error':
      case 'debug':
      case 'end': {
        break;
      }

      default: {
        never(fragment);
      }
    }
  }

  addConnectionEvent(evt: ConnectionEvent) {
    switch (evt) {
      case 'connecting':
      case 'reconnecting': {
        if (!this.uiState.loading) {
          this.uiState.loading = true;
          this.updateUi();
        }

        break;
      }

      case 'connected': {
        if (this.uiState.loading) {
          this.uiState.loading = false;
          this.updateUi();
        }

        break;
      }

      default: {
        never(evt);
      }
    }
  }

  getUiState(afterIndex: number) {
    if (this.uiState.index > afterIndex) {
      return this.uiState;
    }

    return new Promise<UiState>((resolve) => {
      this.uiStateRequests.push(() => resolve(this.uiState));
    });
  }

  updateFeatureCount(disfluent: AnalysisDisfluent) {
    let category = this.sessionStats.featureCounts[disfluent.category];

    if (category === undefined) {
      category = {};
      this.sessionStats.featureCounts[disfluent.category] = category;
    }

    category[disfluent.text] = (category[disfluent.text] ?? 0) + 1;
  }

  updateMetrics() {
    const fillerSoundMetric = this.fillerSoundEwma.value.toFixed(1);
    const fillerWordMetric = this.fillerWordEwma.value.toFixed(1);

    if (
      this.uiState.fillerSoundBox.metric !== fillerSoundMetric ||
      this.uiState.fillerWordBox.metric !== fillerWordMetric
    ) {
      this.uiState.fillerSoundBox.metric = fillerSoundMetric;
      this.uiState.fillerWordBox.metric = fillerWordMetric;

      this.updateUi();
    }
  }
}
