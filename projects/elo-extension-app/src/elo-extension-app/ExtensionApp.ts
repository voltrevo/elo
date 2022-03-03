import { keccak_256 } from 'js-sha3';

import EwmaCalculator from './EwmaCalculator';
import Protocol, { ConnectionEvent } from './Protocol';
import SessionStats, { initSessionStats } from '../elo-types/SessionStats';
import Storage, { RandomKey } from './storage/Storage';
import UiState from './UiState';
import never from '../common-pure/never';
import delay from '../common-pure/delay';
import TaskQueue from '../common-pure/TaskQueue';
import { AnalysisDisfluent, AnalysisFragment } from '../elo-types/Analysis';
import Feedback from '../elo-types/Feedback';
import { PromisishApi } from './protocolHelpers';
import Registration from '../elo-types/Registration';
import LoginCredentials from '../elo-types/LoginCredentials';
import AccountRoot, { initAccountRoot } from './storage/AccountRoot';
import IBackendApi from './IBackendApi';
import IGoogleAuthApi from './IGoogleAuthApi';

export default class ExtensionApp implements PromisishApi<Protocol> {
  uiState = UiState();
  sessionStats = initSessionStats(document.title, Date.now());
  sessionToken?: string;
  uiStateRequests = new TaskQueue();

  fillerSoundEwma = new EwmaCalculator(60, 60);
  fillerWordEwma = new EwmaCalculator(60, 60);

  sessionKey = RandomKey(); // FIXME

  constructor(
    public backendApi: IBackendApi,
    public googleAuthApi: IGoogleAuthApi,
    public dashboardUrl: string,
    public storage: Storage,
  ) {}

  async UserId() {
    const root = await this.storage.readRoot();
    let userId: string;

    if (root.userId === undefined) {
      userId = await this.backendApi.generateId();

      root.userId = userId;
      await this.storage.writeRoot(root);
    } else {
      userId = root.userId;
    }

    return userId;
  }

  async readAccountRoot() {
    const root = await this.storage.readRoot();

    if (!root.accountRoot) {
      return undefined;
    }

    return await this.storage.read(AccountRoot, root.accountRoot);
  }

  async activate() {
    (globalThis as any).eloExtensionApp = this;

    const root = await this.storage.readRoot();

    if (root.userId === undefined) {
      root.userId = await this.backendApi.generateId();
    }

    this.sessionStats.lastSessionKey = root.lastSessionKey;
    root.lastSessionKey = this.sessionKey;
    await this.storage.writeRoot(root);

    const startSessionResponse = await this.backendApi.startSession({
      userId: root.userId,
    });

    let sessionToken: string;

    if (startSessionResponse[0] === '{') {
      sessionToken = JSON.parse(startSessionResponse).sessionToken;
    } else {
      sessionToken = startSessionResponse;
    }

    this.sessionToken = sessionToken;
    this.sessionStats.sessionToken = sessionToken;
    await this.updateStats(0, 0);

    return sessionToken;
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

  async getSessionToken() {
    return this.sessionToken;
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

  // eslint-disable-next-line class-methods-use-this
  getDashboardUrl() {
    return this.dashboardUrl;
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

    this.storage.write(SessionStats, this.sessionKey, this.sessionStats);
  }

  async setMetricPreference(preference: string) {
    const root = await this.storage.readRoot();

    // TODO: Check string? Need to add typing to storage.
    root.metricPreference = preference;

    await this.storage.writeRoot(root);

    return 'success';
  }

  sendVerificationEmail(email: string) {
    this;
    console.log(keccak_256(email).slice(0, 6));
  }

  async checkVerificationEmail(email: string, code: string) {
    this;
    await delay(500);

    return code === keccak_256(email).slice(0, 6);
  }

  async googleAuth() {
    return await this.googleAuthApi.login();
  }

  async register(registration: Registration) {
    const anonymousAccountRoot = await this.storage.read(AccountRoot, 'elo-user:anonymous');

    const { userId, email, googleAccount } = await this.backendApi.register({
      ...registration,
      userId: anonymousAccountRoot?.userId,
    });

    const accountRoot = anonymousAccountRoot ?? initAccountRoot();
    accountRoot.userId = userId;
    accountRoot.email = email;
    accountRoot.googleAccount = googleAccount;

    const accountRootKey = `elo-user:${accountRoot.userId}`;

    await this.storage.write(AccountRoot, accountRootKey, accountRoot);

    const root = await this.storage.readRoot();
    root.accountRoot = accountRootKey;
    await this.storage.writeRoot(root);

    if (anonymousAccountRoot !== undefined) {
      await this.storage.remove('elo-user:anonymous');
    }

    return email;
  }

  async login(credentials: LoginCredentials) {
    const anonymousAccountRoot = await this.storage.read(AccountRoot, 'elo-user:anonymous');
    const accountRoot = anonymousAccountRoot ?? initAccountRoot();

    const { userId, email, googleAccount } = await this.backendApi.login(credentials);

    accountRoot.userId = userId;
    accountRoot.email = email;
    accountRoot.googleAccount = googleAccount;

    const accountRootKey = `elo-user:${accountRoot.userId}`;

    await this.storage.write(AccountRoot, accountRootKey, accountRoot);

    const root = await this.storage.readRoot();
    root.accountRoot = accountRootKey;
    await this.storage.writeRoot(root);

    if (anonymousAccountRoot !== undefined) {
      await this.storage.remove('elo-user:anonymous');
    }

    return email;
  }

  async sendFeedback(feedback: Feedback) {
    if (feedback.sentiment === undefined && feedback.message === undefined) {
      throw new Error('Please include an emoji or a message.');
    }

    // TODO: Use response from server
    await this.backendApi.feedback({
      userId: await this.UserId(),
      feedback,
    });

    if (feedback.positive) {
      return 'Thanks! We\'re so glad you\'re enjoying Elo.';
    }

    if (feedback.negative) {
      return "We're sorry to hear that. Thanks for letting us know.";
    }

    return 'Thanks!';
  }

  async logout() {
    const accountRoot = await this.readAccountRoot();

    if (accountRoot === undefined) {
      console.error('already logged out');
      return;
    }

    if (accountRoot?.googleAccount) {
      await this.googleAuthApi.logout();
    }

    if (accountRoot !== undefined) {
      const root = await this.storage.readRoot();
      root.accountRoot = undefined;
      await this.storage.writeRoot(root);
    }
  }

  async getEmail() {
    const accountRoot = await this.readAccountRoot();
    return accountRoot?.email;
  }
}
