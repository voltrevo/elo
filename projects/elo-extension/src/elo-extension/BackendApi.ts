import * as io from 'io-ts';

import IBackendApi from '../elo-extension-app/IBackendApi';
import Feedback from '../elo-types/Feedback';
import backendApiSpec from '../elo-types/backendApiSpec';
import decode from '../elo-types/decode';

type Spec = typeof backendApiSpec;

export default class BackendApi implements IBackendApi {
  constructor(public apiBase: string) {}

  private async genericCall<Path extends keyof IBackendApi>(
    path: Path,
    body: io.TypeOf<Spec[Path]['Request']>,
  ): Promise<io.TypeOf<Spec[Path]['Response']>> {
    const jsonResponse = await fetch(
      `${this.apiBase}/${path}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(body),
      },
    ).then(res => res.json());

    return decode(backendApiSpec[path].Response, jsonResponse);
  }

  async generateId(): Promise<string> {
    return await fetch(`${this.apiBase}/generateId`, { method: 'POST' })
        .then(res => res.text());
  }

  async startSession(body: { userId: string | undefined; }): Promise<string> {
    return await fetch(`${this.apiBase}/startSession`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(body),
    }).then(res => res.text());
  }

  async feedback(body: { userId: string; feedback: Feedback }): Promise<undefined> {
    const feedbackResponse = await fetch(`${this.apiBase}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(body),
    });

    if (feedbackResponse.status !== 200) {
      throw new Error(await feedbackResponse.text());
    }

    return undefined;
  }

  passwordHardeningSalt(body: io.TypeOf<Spec['passwordHardeningSalt']['Request']>) {
    return this.genericCall('passwordHardeningSalt', body);
  }

  register(body: io.TypeOf<Spec['register']['Request']>) {
    return this.genericCall('register', body);
  }

  login(body: io.TypeOf<Spec['login']['Request']>) {
    return this.genericCall('login', body);
  }
}
