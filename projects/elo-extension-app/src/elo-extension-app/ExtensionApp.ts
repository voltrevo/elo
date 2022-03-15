import EwmaCalculator from './EwmaCalculator';
import Protocol, { ConnectionEvent, ProtocolLoginCredentials, ProtocolRegistration } from './Protocol';
import SessionStats, { initSessionStats } from '../elo-types/SessionStats';
import Storage, { anonymousAccountRootKey, RandomKey } from './storage/Storage';
import UiState from './UiState';
import never from '../common-pure/never';
import TaskQueue from '../common-pure/TaskQueue';
import { AnalysisDisfluent, AnalysisFragment } from '../elo-types/Analysis';
import Feedback from '../elo-types/Feedback';
import { PromisishApi } from './protocolHelpers';
import Registration from '../elo-types/Registration';
import LoginCredentials from '../elo-types/LoginCredentials';
import AccountRoot, { initAccountRoot } from './storage/AccountRoot';
import IBackendApi from './IBackendApi';
import IGoogleAuthApi from './IGoogleAuthApi';
import assert from '../common-pure/assert';
import hardenPasswordViaWorker from '../elo-page/hardenPasswords/hardenPasswordViaWorker';

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
    const accountRoot = await this.readAccountRoot();
    assert(accountRoot.userId !== undefined);

    return accountRoot.userId;
  }

  async readAccountRoot() {
    const root = await this.storage.readRoot();

    if (!root.accountRoot) {
      // TODO: Eventually we won't allow creating anonymous accounts.
      const accountRoot = initAccountRoot();
      accountRoot.userId = await this.backendApi.generateId({});
      await this.storage.write(AccountRoot, anonymousAccountRootKey, accountRoot);
      root.accountRoot = anonymousAccountRootKey;
      await this.storage.writeRoot(root);
    }

    const accountRoot = await this.storage.read(AccountRoot, root.accountRoot);

    if (accountRoot === undefined) {
      throw new Error('Failed to read account root');
    }

    return accountRoot;
  }

  async writeAccountRoot(accountRoot: AccountRoot) {
    const root = await this.storage.readRoot();

    assert(root.accountRoot !== undefined);
    assert(accountRoot.userId !== undefined);

    assert(
      root.accountRoot.includes(accountRoot.userId) ||
      root.accountRoot.includes('anonymous')
    );

    await this.storage.write(AccountRoot, root.accountRoot, accountRoot);
  }

  async activate() {
    (globalThis as any).eloExtensionApp = this;

    const accountRoot = await this.readAccountRoot();

    this.sessionStats.lastSessionKey = accountRoot.lastSessionKey;
    accountRoot.lastSessionKey = this.sessionKey;

    const eloLoginToken = accountRoot.eloLoginToken;

    const startSessionResponse = await this.backendApi.startSession(
      eloLoginToken !== undefined
        ? { eloLoginToken }

        // DEPRECATED: Using deprecated format to support missing eloLoginToken
        : { userId: accountRoot.userId }
    );

    let sessionToken: string;

    if (startSessionResponse[0] === '{') {
      sessionToken = JSON.parse(startSessionResponse).sessionToken;
    } else {
      sessionToken = startSessionResponse;
    }

    this.sessionToken = sessionToken;
    this.sessionStats.sessionToken = sessionToken;
    await this.updateStats(0, 0);
    await this.writeAccountRoot(accountRoot);

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

  async sendVerificationEmail(email: string) {
    await this.backendApi.sendVerificationEmail({ email });
  }

  async checkVerificationEmail(email: string, code: string) {
    return await this.backendApi.checkVerificationEmail({ email, code });
  }

  async googleAuth() {
    return await this.googleAuthApi.login();
  }

  async register(protocolRegistration: ProtocolRegistration) {
    const anonymousAccountRoot = await this.storage.read(AccountRoot, anonymousAccountRootKey);
    const userIdHint = anonymousAccountRoot?.userId;

    let registration: Registration;

    if ('password' in protocolRegistration) {
      registration = {
        userIdHint,
        email: protocolRegistration.email,
        hardenedPassword: await hardenPasswordViaWorker(
          protocolRegistration.password,
          (await this.backendApi.passwordHardeningSalt({
            email: protocolRegistration.email,
            userIdHint: !userIdHint ? undefined : {
              verificationCode: protocolRegistration.code,
              userId: userIdHint,
            },
          })).passwordHardeningSalt,
          700000, // TODO: config
        ),
        code: protocolRegistration.code,
      };
    } else if ('googleAccessToken' in protocolRegistration) {
      registration = {
        userIdHint,
        googleAccessToken: protocolRegistration.googleAccessToken,
      };
    } else {
      never(protocolRegistration);
    }

    const { eloLoginToken, userId, email, googleAccount } = await this.backendApi.register(
      registration,
    );

    const accountRoot = anonymousAccountRoot ?? initAccountRoot();
    accountRoot.eloLoginToken = eloLoginToken;
    accountRoot.userId = userId;
    accountRoot.email = email;
    accountRoot.googleAccount = googleAccount;

    const accountRootKey = `elo-user:${accountRoot.userId}`;

    await this.storage.write(AccountRoot, accountRootKey, accountRoot);

    const root = await this.storage.readRoot();
    root.accountRoot = accountRootKey;
    await this.storage.writeRoot(root);

    if (anonymousAccountRoot !== undefined) {
      await this.storage.remove(anonymousAccountRootKey);
    }

    return email;
  }

  async login(protocolCredentials: ProtocolLoginCredentials) {
    let credentials: LoginCredentials;

    if ('password' in protocolCredentials) {
      credentials = {
        email: protocolCredentials.email,
        hardenedPassword: await hardenPasswordViaWorker(
          protocolCredentials.password,
          (await this.backendApi.passwordHardeningSalt({
            email: protocolCredentials.email,
            userIdHint: undefined,
          })).passwordHardeningSalt,
          700000, // TODO: config
        ),
      };
    } else if ('googleAccessToken' in protocolCredentials) {
      credentials = {
        googleAccessToken: protocolCredentials.googleAccessToken,
      };
    } else {
      never(protocolCredentials);
    }

    const { eloLoginToken, userId, email, googleAccount } = await this.backendApi.login(credentials);
    const anonymousAccountRoot = await this.storage.read(AccountRoot, anonymousAccountRootKey);
    const existingAccountRoot = await this.storage.read(AccountRoot, `elo-user:${userId}`);

    const accountRoot = existingAccountRoot ?? anonymousAccountRoot ?? initAccountRoot();
    accountRoot.eloLoginToken = eloLoginToken;
    accountRoot.userId = userId;
    accountRoot.email = email;
    accountRoot.googleAccount = googleAccount;

    const accountRootKey = `elo-user:${accountRoot.userId}`;

    await this.storage.write(AccountRoot, accountRootKey, accountRoot);

    const root = await this.storage.readRoot();
    root.accountRoot = accountRootKey;
    await this.storage.writeRoot(root);

    if (existingAccountRoot === undefined && anonymousAccountRoot !== undefined) {
      await this.storage.remove(anonymousAccountRootKey);
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
