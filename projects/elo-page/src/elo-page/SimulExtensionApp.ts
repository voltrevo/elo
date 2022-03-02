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

  async register(registration: Registration) {
    await delay(500);

    let email: string;

    if ('email' in registration) {
      email = registration.email;
    } else {
      email = 'alice@example.com';
    }

    const storageRoot = await this.storage.readRoot();
    storageRoot.email = email;
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
    storageRoot.email = email;
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
    storageRoot.email = undefined;
    await this.storage.writeRoot(storageRoot);
  }

  async getEmail() {
    const storageRoot = await this.storage.readRoot();
    return storageRoot.email;
  }
}
