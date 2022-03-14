import delay from '../common-pure/delay';
import Feedback from '../elo-types/Feedback';
import config from './config';
import ExtensionApp from '../elo-extension-app/ExtensionApp';
import IGoogleAuthApi from '../elo-extension-app/IGoogleAuthApi';
import IBackendApi, { LoginResult } from '../elo-extension-app/IBackendApi';
import Registration from '../elo-types/Registration';
import LoginCredentials from '../elo-types/LoginCredentials';
import Storage from '../elo-extension-app/storage/Storage';

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

class SimulBackendApi implements IBackendApi {
  passwordHardeningSalt(body: { email: string; userIdHint?: { verificationCode: string; userId: string; } | undefined; }): never {
    throw new Error('Method not implemented.');
  }
  googleAuthApi = new SimulGoogleAuthApi();
  knownUsers: Record<string, string> = {};

  async generateId(): Promise<string> {
    await delay(500);
    return `fake-id-${Date.now()}`;
  }

  startSession(_body: { userId: string | undefined; }): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async feedback(_body: { userId: string; feedback: Feedback }): Promise<undefined> {
    await delay(500);
    return undefined;
  }

  async register(registration: Registration): Promise<LoginResult> {
    await delay(500);

    if (shiftKey && registration.userIdHint) {
      // Not super realistic - you'd need to manually reuse the anonymous
      // userId with a different account in order to get this result.
      throw new Error('Provided userId already associated with other account');
    }

    if ('email' in registration && registration.email.includes('error')) {
      throw new Error('email contains "error"');
    }

    const email = await (async () => {
      if ('email' in registration) {
        return registration.email;
      }
  
      const detail = await this.googleAuthApi.getTokenDetail(registration.googleAccessToken);
  
      return detail.email;
    })();

    if (email in this.knownUsers) {
      throw new Error('Account already exists');
    }

    const result = {
      eloLoginToken: 'elo-login-token',
      userId: registration.userIdHint ?? await this.generateId(),
      email,
      googleAccount: 'googleAccessToken' in registration ? email : undefined,
    };

    this.knownUsers[email] = result.userId;

    return result;
  }

  async login(credentials: LoginCredentials): Promise<LoginResult> {
    await delay(500);

    if ('email' in credentials && credentials.email.includes('error')) {
      throw new Error('email includes "error"');
    }

    const email = await (async () => {
      if ('email' in credentials) {
        return credentials.email;
      }
  
      const detail = await this.googleAuthApi.getTokenDetail(credentials.googleAccessToken);
  
      return detail.email;
    })();

    const result = {
      eloLoginToken: 'elo-login-token',
      userId: this.knownUsers[email] ?? await this.generateId(),
      email,
      googleAccount: 'googleAccessToken' in credentials ? email : undefined,
    };

    this.knownUsers[email] = result.userId;

    return result;
  }
}

class SimulGoogleAuthApi implements IGoogleAuthApi {
  async login() {
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
    }
  }

  async getTokenDetail(_token: string) {
    await delay(500);

    return {
      issued_to: config.googleOauthClientId,
      expires_in: 3599,
      email: "alice@example.com",
      verified_email: true,
    }
  }

  async logout() {
    await delay(500);
    await delay(500);
  }
}

export default function SimulExtensionApp(storage: Storage): ExtensionApp {
  return new ExtensionApp(
    new SimulBackendApi(),
    new SimulGoogleAuthApi(),
    'dashboard.html',
    storage,
  );
}
