import EwmaCalculator from './EwmaCalculator';
import Protocol, { ConnectionEvent, ProtocolLoginCredentials, ProtocolRegistration } from './Protocol';
import SessionStats, { initSessionStats } from '../elo-types/SessionStats';
import DeviceStorage, { anonymousAccountRootKey, RandomKey } from './deviceStorage/DeviceStorage';
import UiState from './UiState';
import never from '../common-pure/never';
import TaskQueue from '../common-pure/TaskQueue';
import { AnalysisDisfluent, AnalysisFragment } from '../elo-types/Analysis';
import Feedback from '../elo-types/Feedback';
import { PromisishApi } from '../common-pure/protocolHelpers';
import Registration from '../elo-types/Registration';
import LoginCredentials from '../elo-types/LoginCredentials';
import AccountRoot, { initAccountRoot } from './deviceStorage/AccountRoot';
import IBackendApi from './IBackendApi';
import IGoogleAuthApi from './IGoogleAuthApi';
import assert from '../common-pure/assert';
import hardenPasswordViaWorker from '../elo-page/hardenPasswords/hardenPasswordViaWorker';
import mergeAccountRoots from './mergeAccountRoots';
import accumulateStats from './accumulateStats';
import DeviceStorageView from './deviceStorage/DeviceStorageView';
import setAccountRootUserId from './setAccountRootUserId';
import StorageClient from '../storage-client/StorageClient';
import nil from '../common-pure/nil';
import { initAggregateStats } from '../elo-types/AggregateStats';
import RemoteStorage from './RemoteStorage';
import Settings, { defaultSettings } from './sharedStorageTypes/Settings';

type AccountRootWithToken = AccountRoot & { eloLoginToken: string };

export default class ExtensionApp implements PromisishApi<Protocol> {
  uiState = UiState();
  sessionStats?: SessionStats;
  sessionToken?: string;
  uiStateRequests = new TaskQueue();

  fillerSoundEwma = new EwmaCalculator(60, 60);
  fillerWordEwma = new EwmaCalculator(60, 60);

  remoteStorage?: RemoteStorage;
  cachedSettings?: Settings;

  sessionKey = RandomKey(); // FIXME

  constructor(
    public backendApi: IBackendApi,
    public googleAuthApi: IGoogleAuthApi,
    public dashboardUrl: string,
    public deviceStorage: DeviceStorage,
    public makeStorageClient: (eloLoginToken: string) => Promise<StorageClient>,
  ) {}

  async UserId() {
    const accountRoot = await this.readAccountRoot();

    if (accountRoot === nil) {
      return nil;
    }

    assert(accountRoot.userId !== nil);

    return accountRoot.userId;
  }

  async readAccountRoot(): Promise<AccountRootWithToken | nil> {
    const root = await this.deviceStorage.readRoot();

    if (!root.accountRoot) {
      const existingAnonymousAccountRoot = await this.deviceStorage.read(
        AccountRoot,
        anonymousAccountRootKey,
      );

      if (!existingAnonymousAccountRoot) {
        // This is where anonymous accounts used to be generated. We don't do
        // that anymore. This is the meaning of readAccountRoot returning nil -
        // the user doesn't have an account, and the app might need to prompt
        // the user to create one.
        return nil;
      }

      root.accountRoot = anonymousAccountRootKey;
      await this.deviceStorage.writeRoot(root);
    }

    const accountRoot = await this.deviceStorage.read(AccountRoot, root.accountRoot);

    if (accountRoot === nil) {
      throw new Error('Failed to read account root');
    }

    if (accountRoot.eloLoginToken === nil) {
      const grant = await this.backendApi.grantTokenForAnonymousUserId({
        userId: accountRoot.userId,
      });

      accountRoot.eloLoginToken = grant.eloLoginToken;
      await this.writeAccountRoot(accountRoot);

      await this.backendApi.acceptTokenForAnonymousUserId({
        eloLoginToken: grant.eloLoginToken,
      });
    }

    // This does nothing at runtime, but TypeScript is just not quite able to infer correctly
    // without specifying eloLoginToken again here.
    return { ...accountRoot, eloLoginToken: accountRoot.eloLoginToken };
  }

  async writeAccountRoot(accountRoot: AccountRoot) {
    const root = await this.deviceStorage.readRoot();

    assert(root.accountRoot !== nil);
    assert(accountRoot.userId !== nil);

    assert(
      root.accountRoot.includes(accountRoot.userId) ||
      root.accountRoot.includes('anonymous')
    );

    await this.deviceStorage.write(AccountRoot, root.accountRoot, accountRoot);
  }

  async RemoteStorage() {
    if (!this.remoteStorage) {
      const accountRoot = await this.readAccountRoot();

      if (accountRoot === nil) {
        return nil;
      }
  
      this.remoteStorage = new RemoteStorage(
        await this.makeStorageClient(accountRoot.eloLoginToken),
      );
    }

    return this.remoteStorage;
  }

  getSessionStats(userId: string) {
    if (this.sessionStats === nil) {
      this.sessionStats = initSessionStats(userId, document.title, Date.now());
    }

    return this.sessionStats;
  }

  async activate(accountRoot: AccountRootWithToken) {
    (globalThis as any).eloExtensionApp = this;

    const sessionStats = this.getSessionStats(accountRoot.userId);
    sessionStats.lastSessionKey = accountRoot.lastSessionKey;
    accountRoot.lastSessionKey = this.sessionKey;

    const eloLoginToken = accountRoot.eloLoginToken;

    const startSessionResponse = await this.backendApi.startSession({
      eloLoginToken,
    });

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

    const lastSession = (
      sessionStats.lastSessionKey !== nil &&
      await this.deviceStorage.read(SessionStats, sessionStats.lastSessionKey)
    );

    if (lastSession) {
      accumulateStats(accountRoot.aggregateStats, lastSession);
    }

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

    const accountRoot = await this.readAccountRoot();

    if (accountRoot === nil) {
      this.uiState.notifyMissingAccount = true;
      this.updateUi();
      return;
    }

    this.uiState.active = true;
    await this.activate(accountRoot);
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
    if (this.sessionStats === nil) {
      return;
    }

    let category = this.sessionStats.featureCounts[disfluent.category];

    if (category === nil) {
      category = {};
      this.sessionStats.featureCounts[disfluent.category] = category;
    }

    category[disfluent.text] = (category[disfluent.text] ?? 0) + 1;
  }

  async updateMetrics() {
    let liveStatsMode = (this.cachedSettings ?? await this.readSettings())?.liveStatsMode ?? 'count';

    const fillerSoundMetric = this.fillerSoundEwma.render(liveStatsMode);
    const fillerWordMetric = this.fillerWordEwma.render(liveStatsMode);

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
    if (this.sessionStats === nil) {
      return;
    }

    this.sessionStats.title = document.title;
    this.sessionStats.end = Date.now();
    this.sessionStats.speakingTime += speakingTime;
    this.sessionStats.audioTime += audioTime;

    await this.deviceStorage.write(SessionStats, this.sessionKey, this.sessionStats);
  }

  // The aggregateStats on the account root do not include the most recent session.
  // (This way as the session evolves the account root doesn't need to be constantly
  // updated.)
  async getAggregateStats() {
    const accountRoot = await this.readAccountRoot();
    
    if (accountRoot === nil) {
      return initAggregateStats();
    }

    const aggregateStats = accountRoot.aggregateStats;

    if (accountRoot.lastSessionKey === nil) {
      return aggregateStats;
    }

    const lastSession = await this.deviceStorage.read(SessionStats, accountRoot.lastSessionKey);

    if (lastSession !== nil) {
      accumulateStats(aggregateStats, lastSession);
    }

    return aggregateStats;
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
    const storageView = new DeviceStorageView(this.deviceStorage);
    const anonymousAccountRoot = await storageView.read(AccountRoot, anonymousAccountRootKey);
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
            userIdHint: !userIdHint ? nil : {
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

    let accountRoot = anonymousAccountRoot ?? initAccountRoot(userId);
    accountRoot.eloLoginToken = eloLoginToken;
    await setAccountRootUserId(storageView, accountRoot, userId);
    accountRoot.email = email;
    accountRoot.googleAccount = googleAccount;

    const accountRootKey = `elo-user:${accountRoot.userId}`;

    storageView.write(AccountRoot, accountRootKey, accountRoot);

    const root = await storageView.readRoot();
    root.accountRoot = accountRootKey;
    storageView.writeRoot(root);

    if (anonymousAccountRoot !== nil) {
      storageView.remove([anonymousAccountRootKey]);
    }

    await storageView.commit();

    return email;
  }

  async login(protocolCredentials: ProtocolLoginCredentials) {
    let credentials: LoginCredentials;
    const storageView = new DeviceStorageView(this.deviceStorage);

    if ('password' in protocolCredentials) {
      credentials = {
        email: protocolCredentials.email,
        hardenedPassword: await hardenPasswordViaWorker(
          protocolCredentials.password,
          (await this.backendApi.passwordHardeningSalt({
            email: protocolCredentials.email,
            userIdHint: nil,
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

    let accountRoot = existingAccountRoot ?? anonymousAccountRoot ?? initAccountRoot(userId);
    accountRoot.eloLoginToken = eloLoginToken;
    await setAccountRootUserId(storageView, accountRoot, userId);
    accountRoot.email = email;
    accountRoot.googleAccount = googleAccount;

    if (anonymousAccountRoot && accountRoot !== anonymousAccountRoot) {
      accountRoot = await mergeAccountRoots(storageView, accountRoot, anonymousAccountRoot);
    }

    const accountRootKey = `elo-user:${accountRoot.userId}`;

    storageView.write(AccountRoot, accountRootKey, accountRoot);

    const root = await storageView.readRoot();
    root.accountRoot = accountRootKey;
    storageView.writeRoot(root);

    if (anonymousAccountRoot !== nil) {
      storageView.remove([anonymousAccountRootKey]);
    }

    await storageView.commit();

    return email;
  }

  async sendFeedback(feedback: Feedback) {
    if (feedback.sentiment === nil && feedback.message === nil) {
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

    if (accountRoot === nil) {
      console.error('already logged out');
      return;
    }

    if (accountRoot?.googleAccount) {
      await this.googleAuthApi.logout();
    }

    if (accountRoot !== nil) {
      const root = await this.deviceStorage.readRoot();
      root.accountRoot = nil;
      await this.deviceStorage.writeRoot(root);
    }
  }

  async getEmail() {
    const accountRoot = await this.readAccountRoot();
    return accountRoot?.email;
  }

  async readSettings() {
    const rs = await this.RemoteStorage();

    if (rs === nil) {
      throw new Error('Not connected to remote storage');
    }

    const settings = await rs.Settings().get();
    this.cachedSettings = settings;

    return settings;
  }

  async writeSettings(settings: Settings) {
    const rs = await this.RemoteStorage();

    if (rs === nil) {
      throw new Error('Not connected to remote storage');
    }

    await rs.Settings().set(settings);
  }
}
