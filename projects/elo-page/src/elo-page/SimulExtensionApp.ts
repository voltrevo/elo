import delay from '../common-pure/delay';
import Feedback from '../elo-types/Feedback';
import config from './config';
import ExtensionApp from '../elo-extension-app/ExtensionApp';
import IGoogleAuthApi from '../elo-extension-app/IGoogleAuthApi';
import IBackendApi from '../elo-extension-app/IBackendApi';
import IRawStorage from '../elo-extension-app/storage/IRawStorage';

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
  generateId(): Promise<string> {
    throw new Error('Method not implemented.');
  }

  startSession(_body: { userId: string; }): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async feedback(_body: { userId: string; feedback: Feedback }): Promise<void> {
    await delay(500);
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

export default function SimulExtensionApp(rawStorage: IRawStorage): ExtensionApp {
  return new ExtensionApp(
    new SimulBackendApi(),
    new SimulGoogleAuthApi(),
    'dashboard.html',
    rawStorage,
  );
}
