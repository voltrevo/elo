import decode from '../elo-types/decode';
import { GoogleAuthResult } from '../elo-types/GoogleAuthResult';

export default async function fetchGoogleTokenInfo(token: string): Promise<GoogleAuthResult['detail']> {
  const tokenInfoJson = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then(res => res.json());

  // TODO: Prevent uncaught exception messages from being sent to the client
  return decode(GoogleAuthResult.props.detail, tokenInfoJson);
}
