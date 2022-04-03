import EwmaCalculator from './EwmaCalculator';
import Protocol, { ConnectionEvent, ProtocolLoginCredentials, ProtocolRegistration } from './Protocol';
import SessionStats, { initSessionStats } from '../elo-types/SessionStats';
import AggregateStats, { initAggregateStats } from '../elo-types/AggregateStats';
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
import mergeAccountRoots from './mergeAccountRoots';
import accumulateStats from './accumulateStats';
import StorageView from './storage/StorageView';

export default class ExtensionApp implements PromisishApi<Protocol> {
  uiState = UiState();
  sessionStats?: SessionStats;
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
      const existingAnonymousAccountRoot = await this.storage.read(
        AccountRoot,
        anonymousAccountRootKey,
      );

      let accountRoot: AccountRoot;

      if (existingAnonymousAccountRoot) {
        accountRoot = existingAnonymousAccountRoot;
      } else {
        // TODO: Eventually we won't allow creating anonymous accounts.
        accountRoot = initAccountRoot(await this.backendApi.generateId({}));
        await this.storage.write(AccountRoot, anonymousAccountRootKey, accountRoot);
      }

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

  getSessionStats(userId: string) {
    if (this.sessionStats === undefined) {
      this.sessionStats = initSessionStats(userId, document.title, Date.now());
    }

    return this.sessionStats;
  }

  async activate() {
    (globalThis as any).eloExtensionApp = this;

    const accountRoot = await this.readAccountRoot();

    const sessionStats = this.getSessionStats(accountRoot.userId);
    sessionStats.lastSessionKey = accountRoot.lastSessionKey;
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
    sessionStats.sessionToken = sessionToken;
    sessionStats.userId = accountRoot.userId;
    await this.updateStats(0, 0);
    await this.updateAggregateStats(sessionStats.lastSessionKey);
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
    if (this.sessionStats === undefined) {
      return;
    }

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

  async updateStats(speakingTime: number, audioTime: number) {
    if (this.sessionStats === undefined) {
      return;
    }

    this.sessionStats.title = document.title;
    this.sessionStats.end = Date.now();
    this.sessionStats.speakingTime += speakingTime;
    this.sessionStats.audioTime += audioTime;

    await this.storage.write(SessionStats, this.sessionKey, this.sessionStats);
  }

  // The aggregateStats on the account root do not include the most recent session.
  // (This way as the session evolves the account root doesn't need to be constantly
  // updated.)
  async getAggregateStats() {
    const accountRoot = await this.readAccountRoot();
    const aggregateStats = (await this.readAccountRoot()).aggregateStats;

    if (accountRoot.lastSessionKey === undefined) {
      return aggregateStats;
    }

    const lastSession = await this.storage.read(SessionStats, accountRoot.lastSessionKey);

    if (lastSession !== undefined) {
      accumulateStats(aggregateStats, lastSession);
    }

    return aggregateStats;
  }

  async updateAggregateStats(lastSessionKey?: string) {
    if (lastSessionKey === undefined) {
      return;
    }

    const lastSession = await this.storage.read(SessionStats, lastSessionKey);

    if (lastSession === undefined) {
      return;
    }

    const accountRoot = await this.readAccountRoot();
    accumulateStats(accountRoot.aggregateStats, lastSession);
    await this.writeAccountRoot(accountRoot);
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

    const accountRoot = anonymousAccountRoot ?? initAccountRoot(userId);
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
      await this.storage.remove([anonymousAccountRootKey]);
    }

    return email;
  }

  async login(protocolCredentials: ProtocolLoginCredentials) {
    let credentials: LoginCredentials;
    const storageView = new StorageView(this.storage);

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
    const anonymousAccountRoot = await storageView.read(AccountRoot, anonymousAccountRootKey);
    const existingAccountRoot = await storageView.read(AccountRoot, `elo-user:${userId}`);

    let accountRoot: AccountRoot;

    if (existingAccountRoot && anonymousAccountRoot) {
      accountRoot = await mergeAccountRoots(storageView, existingAccountRoot, anonymousAccountRoot);
    } else {
      accountRoot = existingAccountRoot ?? anonymousAccountRoot ?? initAccountRoot(userId);
    }

    accountRoot.eloLoginToken = eloLoginToken;
    accountRoot.userId = userId;
    accountRoot.email = email;
    accountRoot.googleAccount = googleAccount;

    const accountRootKey = `elo-user:${accountRoot.userId}`;

    storageView.write(AccountRoot, accountRootKey, accountRoot);

    const root = await storageView.readRoot();
    root.accountRoot = accountRootKey;
    storageView.writeRoot(root);

    if (anonymousAccountRoot !== undefined) {
      storageView.remove([anonymousAccountRootKey]);
    }

    await storageView.commit();

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
