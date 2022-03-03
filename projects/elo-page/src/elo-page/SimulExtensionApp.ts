import delay from '../common-pure/delay';
import { AnalysisFragment } from '../elo-types/Analysis';
import Feedback from '../elo-types/Feedback';
import LoginCredentials from '../elo-types/LoginCredentials';
import Registration from '../elo-types/Registration';
import config from './config';
import Protocol, { ConnectionEvent } from './Protocol';
import UiState from './UiState';
import Storage from './storage/Storage';
import { PromisishApi } from './helpers/protocolHelpers';
import AccountRoot, { initAccountRoot } from './storage/AccountRoot';

let shiftKey = false;

window.addEventListener('load', () => {
  document.addEventListener('keydown', evt => {
    if (evt.key === 'Shift') {
      shiftKey = true;
    }
  });

  document.addEventListener('keyup', evt => {
    if (evt.key === 'Shift') {
      shiftKey = false;
    }
  });
});

export default class SimulExtensionApp implements PromisishApi<Protocol> {
  constructor(public storage: Storage) {}

  notifyGetUserMediaCalled(): void | Promise<void> {
    throw new Error('Method not implemented.');
  }

  addFragment(fragment: AnalysisFragment): void | Promise<void> {
    throw new Error('Method not implemented.');
  }

  addConnectionEvent(evt: ConnectionEvent): void | Promise<void> {
    throw new Error('Method not implemented.');
  }

  getUiState(afterIndex: number): UiState | Promise<UiState> {
    throw new Error('Method not implemented.');
  }

  getDashboardUrl(): string | Promise<string> {
    throw new Error('Method not implemented.');
  }

  getSessionToken(): string | Promise<string | undefined> | undefined {
    throw new Error('Method not implemented.');
  }

  async sendVerificationEmail(email: string): Promise<void> {
    await delay(500);
  }

  async checkVerificationEmail(email: string, code: string): Promise<boolean> {
    await delay(500);
    return code === '123456';
  }

  async setupFakeUser(email: string, googleAccount?: string) {
    const storageRoot = await this.storage.readRoot();

    const userId = 'fake-user-id';

    const accountRootKey = `elo-user:${userId}`;
    const accountRoot = initAccountRoot();
    accountRoot.userId = userId;
    accountRoot.lastSessionKey = storageRoot.lastSessionKey;
    accountRoot.metricPreference = storageRoot.metricPreference;
    accountRoot.email = email;
    accountRoot.googleAccount = googleAccount;

    await this.storage.write(AccountRoot, accountRootKey, accountRoot);

    return accountRootKey;
  }

  async register(registration: Registration) {
    await delay(500);

    let email: string;

    if ('email' in registration) {
      email = registration.email;
    } else {
      email = 'alice@example.com';
    }

    const storageRoot = await this.storage.readRoot();

    const accountRootKey = await this.setupFakeUser(
      email,
      'googleAccessToken' in registration ? registration.googleAccessToken : undefined,
    );

    storageRoot.accountRoot = accountRootKey;
    await this.storage.writeRoot(storageRoot);

    return email;
  }

  async login(credentials: LoginCredentials) {
    await delay(500);

    let email: string;

    if ('email' in credentials) {
      email = credentials.email;
    } else {
      email = 'alice@example.com';
    }

    const storageRoot = await this.storage.readRoot();
    storageRoot.accountRoot = await this.setupFakeUser(email);
    await this.storage.writeRoot(storageRoot);

    return email;
  }

  async sendFeedback(feedback: Feedback) {
    await delay(500);

    return "(Feedback response)";
  }

  async googleAuth() {
    await delay(500);

    return {
      token: 'fake-token',
      registered: shiftKey,
      detail: {
        issued_to: config.googleOauthClientId,
        expires_in: 3599,
        email: "alice@example.com",
        verified_email: true,
      },
    };
  }

  async logout() {
    await delay(500);
    
    const storageRoot = await this.storage.readRoot();
    storageRoot.accountRoot = undefined;
    await this.storage.writeRoot(storageRoot);
  }

  async getEmail() {
    const { accountRoot } = await this.storage.readRoot();

    if (accountRoot === undefined) {
      return undefined;
    }

    return (await this.storage.read(AccountRoot, accountRoot))?.email;
  }
}
