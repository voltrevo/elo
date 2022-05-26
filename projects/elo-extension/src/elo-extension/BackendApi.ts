import * as io from 'io-ts';

import IBackendApi from '../elo-extension-app/IBackendApi';
import Feedback from '../elo-types/Feedback';
import backendApiSpec from '../elo-types/backendApiSpec';
import decode from '../elo-types/decode';
import nil from '../common-pure/nil';

type Spec = typeof backendApiSpec;

export default class BackendApi implements IBackendApi {
  constructor(public apiBase: string) {}

  private async genericCall<Path extends keyof IBackendApi>(
    path: Path,
    body: io.TypeOf<Spec[Path]['Request']>,
  ): Promise<io.TypeOf<Spec[Path]['Response']>> {
    const response = await fetch(
      `${this.apiBase}/${path}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(body),
      },
    );

    if (response.status >= 400) {
      throw new Error(await response.text());
    }

    return decode(backendApiSpec[path].Response, await response.json());
  }

  async startSession(body: io.TypeOf<Spec['startSession']['Request']>): Promise<string> {
    return await fetch(`${this.apiBase}/startSession`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(body),
    }).then(res => res.text());
  }

  async feedback(body: { userId: string | nil; feedback: Feedback }): Promise<undefined> {
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

  sendVerificationEmail(body: io.TypeOf<Spec['sendVerificationEmail']['Request']>) {
    return this.genericCall('sendVerificationEmail', body);
  }

  checkVerificationEmail(body: io.TypeOf<Spec['checkVerificationEmail']['Request']>) {
    return this.genericCall('checkVerificationEmail', body);
  }

  grantTokenForAnonymousUserId(body: io.TypeOf<Spec['grantTokenForAnonymousUserId']['Request']>) {
    return this.genericCall('grantTokenForAnonymousUserId', body);
  }

  acceptTokenForAnonymousUserId(body: io.TypeOf<Spec['acceptTokenForAnonymousUserId']['Request']>) {
    return this.genericCall('acceptTokenForAnonymousUserId', body);
  }

  monthlyStats(body: io.TypeOf<Spec['monthlyStats']['Request']>) {
    return this.genericCall('monthlyStats', body);
  }

  isStaffMember(body: io.TypeOf<Spec['isStaffMember']['Request']>) {
    return this.genericCall('isStaffMember', body);
  }
}
