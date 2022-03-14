import Browser from "webextension-polyfill";
import IGoogleAuthApi from "../elo-extension-app/IGoogleAuthApi";
import { GoogleAuthResult } from "../elo-types/GoogleAuthResult";

export default class GoogleAuthApi implements IGoogleAuthApi {
  constructor(public clientId: string) {}

  async login() {
    const authUrlObj = new URL('https://accounts.google.com/o/oauth2/auth');
    authUrlObj.searchParams.append('client_id', this.clientId);
    authUrlObj.searchParams.append('redirect_uri', Browser.identity.getRedirectURL("oauth2.html"));
    authUrlObj.searchParams.append('response_type', 'token');
    authUrlObj.searchParams.append('scope', 'email');

    const responseUrl = await Browser.identity.launchWebAuthFlow(
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

    const detail = await this.getTokenDetail(accessToken);

    if (detail.issued_to !== this.clientId) {
      throw new Error('Client id mismatch');
    }

    if (!detail.verified_email) {
      throw new Error(`Unverified email ${detail.email}`);
    }

    return {
      token: accessToken,
      detail,
    };
  }

  async getTokenDetail(accessToken: string): Promise<GoogleAuthResult['detail']> {
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

  async logout(): Promise<void> {
    try {
      await Browser.identity.launchWebAuthFlow({
        url: 'https://accounts.google.com/logout',
        interactive: false,
      });
    } catch {}

    const authUrlObj = new URL('https://accounts.google.com/o/oauth2/auth');
    authUrlObj.searchParams.append('client_id', this.clientId);
    authUrlObj.searchParams.append('redirect_uri', Browser.identity.getRedirectURL('oauth2.html'));
    authUrlObj.searchParams.append('response_type', 'token');
    authUrlObj.searchParams.append('scope', 'email');

    try {
      await Browser.identity.launchWebAuthFlow(
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
}
