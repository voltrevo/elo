import browser from 'webextension-polyfill';
import { AnalysisDisfluent, AnalysisFragment } from '../../analyze';
import never from '../../helpers/never';
import TaskQueue from '../../helpers/TaskQueue';
import EwmaCalculator from '../helpers/EwmaCalculator';
import Protocol, { ConnectionEvent, PromisishApi } from './Protocol';
import SessionStats from './storage/SessionStats';
import Storage, { RandomKey } from './storage/Storage';
import UiState from './UiState';

const sessionKey = RandomKey();

export default class ContentApp implements PromisishApi<Protocol> {
  uiState = UiState();
  sessionStats = SessionStats(document.title, Date.now());
  uiStateRequests = new TaskQueue();

  fillerSoundEwma = new EwmaCalculator(60, 60);
  fillerWordEwma = new EwmaCalculator(60, 60);

  storage = new Storage('elo');

  async activate() {
    const root = await this.storage.readRoot();

    this.sessionStats.lastSessionKey = root.lastSessionKey;
    root.lastSessionKey = sessionKey;
    await this.storage.writeRoot(root);

    (window as any).contentApp = this;
  }

  updateUi() {
    this.uiState.index++;
    this.uiStateRequests.run();
  }

  async notifyGetUserMediaCalled() {
    if (this.uiState.active) {
      return;
    }

    await this.activate();
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
          this.uiState.fillerSoundBox.count++;
          this.fillerSoundEwma.observe(1);
        } else {
          this.uiState.fillerWordBox.text = fragment.value.text;
          this.uiState.fillerWordBox.count++;
          this.fillerWordEwma.observe(1);
        }

        this.updateMetrics();

        break;
      }

      case 'progress': {
        this.updateStats(fragment.value.speaking_time, fragment.value.audio_time);

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

  getDashboardUrl() {
    return browser.runtime.getURL('elo-page.html');
  }

  updateFeatureCount(disfluent: AnalysisDisfluent) {
    let category = this.sessionStats.featureCounts[disfluent.category];

    if (category === undefined) {
      category = {};
      this.sessionStats.featureCounts[disfluent.category] = category;
    }

    category[disfluent.text] = (category[disfluent.text] ?? 0) + 1;
  }

  async updateMetrics() {
    const { metricPreference } = (await this.storage.readRoot());

    const fillerSoundMetric = this.fillerSoundEwma.render(metricPreference);
    const fillerWordMetric = this.fillerWordEwma.render(metricPreference);

    if (
      this.uiState.fillerSoundBox.metric !== fillerSoundMetric ||
      this.uiState.fillerWordBox.metric !== fillerWordMetric
    ) {
      this.uiState.fillerSoundBox.metric = fillerSoundMetric;
      this.uiState.fillerWordBox.metric = fillerWordMetric;

      this.updateUi();
    }
  }

  updateStats(speakingTime: number, audioTime: number) {
    this.sessionStats.title = document.title;
    this.sessionStats.end = Date.now();
    this.sessionStats.speakingTime += speakingTime;
    this.sessionStats.audioTime += audioTime;

    this.storage.write<SessionStats>(sessionKey, this.sessionStats);
  }

  async setMetricPreference(preference: string) {
    const root = await this.storage.readRoot();

    // TODO: Check string? Need to add typing to storage.
    root.metricPreference = preference;

    await this.storage.writeRoot(root);

    return 'success';
  }
}
