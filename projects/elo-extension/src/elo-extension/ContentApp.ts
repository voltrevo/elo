import { keccak_256 } from 'js-sha3';
import browser from 'webextension-polyfill';

import clientConfig from './helpers/clientConfig';
import EwmaCalculator from './helpers/EwmaCalculator';
import Protocol, { ConnectionEvent, GoogleAuthResult } from '../elo-page/Protocol';
import SessionStats, { initSessionStats } from '../elo-types/SessionStats';
import Storage, { RandomKey } from '../elo-page/storage/Storage';
import UiState from '../elo-page/UiState';
import never from '../common-pure/never';
import delay from '../common-pure/delay';
import TaskQueue from '../common-pure/TaskQueue';
import { AnalysisDisfluent, AnalysisFragment } from '../elo-types/Analysis';
import Feedback from '../elo-types/Feedback';
import { PromisishApi } from '../elo-page/helpers/protocolHelpers';
import Registration from '../elo-types/Registration';
import LoginCredentials from '../elo-types/LoginCredentials';
import AccountRoot from '../elo-page/storage/AccountRoot';

const sessionKey = RandomKey();
const apiBase = `${clientConfig.tls ? 'https:' : 'http:'}//${clientConfig.hostAndPort}`;

export default class ContentApp implements PromisishApi<Protocol> {
  uiState = UiState();
  sessionStats = initSessionStats(document.title, Date.now());
  sessionToken?: string;
  uiStateRequests = new TaskQueue();

  fillerSoundEwma = new EwmaCalculator(60, 60);
  fillerWordEwma = new EwmaCalculator(60, 60);

  storage = new Storage(browser.storage.local, 'elo');

  async UserId() {
    const root = await this.storage.readRoot();
    let userId: string;

    if (root.userId === undefined) {
      userId = await fetch(`${apiBase}/generateId`, { method: 'POST' })
        .then(res => res.text());

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
    (window as any).contentApp = this;

    const root = await this.storage.readRoot();

    if (root.userId === undefined) {
      root.userId = await fetch(`${apiBase}/generateId`, { method: 'POST' })
        .then(res => res.text());
    }

    this.sessionStats.lastSessionKey = root.lastSessionKey;
    root.lastSessionKey = sessionKey;
    await this.storage.writeRoot(root);

    const startSessionResponse = await fetch(`${apiBase}/startSession`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        userId: root.userId,
      }),
    }).then(res => res.text());

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

    this.storage.write(SessionStats, sessionKey, this.sessionStats);
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

  async register(registration: Registration) {
    this;
    await delay(500);

    if ('password' in registration && registration.password !== 'test') {
      throw new Error('password was not "test"');
    }

    if ('email' in registration) {
      return registration.email;
    }

    const detail = await this.getGoogleTokenDetail(registration.googleAccessToken);

    return detail.email;
  }

  async login(credentials: LoginCredentials) {
    this;
    await delay(500);

    if ('password' in credentials && credentials.password !== 'test') {
      throw new Error('password was not "test"');
    }

    if ('email' in credentials) {
      return credentials.email;
    }

    const detail = await this.getGoogleTokenDetail(credentials.googleAccessToken);

    return detail.email;
  }

  async sendFeedback(feedback: Feedback) {
    if (feedback.sentiment === undefined && feedback.message === undefined) {
      throw new Error('Please include an emoji or a message.');
    }

    const feedbackResponse = await fetch(`${apiBase}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        userId: await this.UserId(),
        feedback,
      }),
    });

    if (feedbackResponse.status !== 200) {
      throw new Error(await feedbackResponse.text());
    }

    if (feedback.positive) {
      return 'Thanks! We\'re so glad you\'re enjoying Elo.';
    }

    if (feedback.negative) {
      return "We're sorry to hear that. Thanks for letting us know.";
    }

    return 'Thanks!';
  }

  async googleAuth(): Promise<GoogleAuthResult> {
    const authUrlObj = new URL('https://accounts.google.com/o/oauth2/auth');
    authUrlObj.searchParams.append('client_id', clientConfig.googleOauthClientId);
    authUrlObj.searchParams.append('redirect_uri', browser.identity.getRedirectURL("oauth2.html"));
    authUrlObj.searchParams.append('response_type', 'token');
    authUrlObj.searchParams.append('scope', 'email');

    const responseUrl = await browser.identity.launchWebAuthFlow(
      {
        url: authUrlObj.toString(),
        interactive: true,
      },
    );

    const responseUrlHash = new URL(responseUrl).hash;
    const accessToken = new URLSearchParams(responseUrlHash.slice(1)).get('access_token');

    if (accessToken === null) {
      throw new Error('Missing access_token');
    }

    const detail = await this.getGoogleTokenDetail(accessToken);

    if (detail.issued_to !== clientConfig.googleOauthClientId) {
      throw new Error('Client id mismatch');
    }

    if (!detail.verified_email) {
      throw new Error(`Unverified email ${detail.email}`);
    }

    return {
      token: accessToken,
      registered: false, // TODO: implement this
      detail,
    };
  }

  async getGoogleTokenDetail(accessToken: string): Promise<GoogleAuthResult['detail']> {
    // TODO: Server needs to do this too (maybe only on server?)
    const tokenInfoJson = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }).then(res => res.json());

    const decodeResult = GoogleAuthResult.props.detail.decode(tokenInfoJson);

    if ('left' in decodeResult) {
      // TODO: Use reporter
      throw new Error(decodeResult.left.map(e => e.message).join('\n'));
    }

    return decodeResult.right;
  }

  async googleAuthLogout(): Promise<void> {
    try {
      await browser.identity.launchWebAuthFlow({
        url: 'https://accounts.google.com/logout',
        interactive: false,
      });
    } catch {}

    const authUrlObj = new URL('https://accounts.google.com/o/oauth2/auth');
    authUrlObj.searchParams.append('client_id', clientConfig.googleOauthClientId);
    authUrlObj.searchParams.append('redirect_uri', browser.identity.getRedirectURL('oauth2.html'));
    authUrlObj.searchParams.append('response_type', 'token');
    authUrlObj.searchParams.append('scope', 'email');

    try {
      await browser.identity.launchWebAuthFlow(
        {
          url: authUrlObj.toString(),
          interactive: false,
        },
      );

      throw new Error('Failed to log out');
    } catch {
      return;
    }
  }

  async logout() {
    const accountRoot = await this.readAccountRoot();

    if (accountRoot === undefined) {
      console.error('already logged out');
      return;
    }

    if (accountRoot?.googleAccount) {
      await this.googleAuthLogout();
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
