import * as io from 'io-ts';
import * as msgpack from '@msgpack/msgpack';
import reporter from 'io-ts-reporters';

import createBranca, { Branca } from './helpers/createBranca';
import ErrorData from '../common-pure/ErrorData';

export default class TokenBicoder<TokenData> {
  private branca: Branca;
  public TokenData: io.Type<TokenData>;
  public validDurationSeconds: number;

  constructor(
    tokenEncryptionSecret: string,
    // eslint-disable-next-line no-shadow
    TokenData: io.Type<TokenData>,
    validDurationSeconds: number,
  ) {
    this.branca = createBranca(tokenEncryptionSecret);
    this.TokenData = TokenData;
    this.validDurationSeconds = validDurationSeconds;
  }

  encode(tokenData: TokenData) {
    return this.branca.encode(msgpack.encode(tokenData));
  }

  decode(token: string): TokenData | ErrorData<'unreadable' | 'expired' | 'internal'> {
    let buf: Uint8Array;

    try {
      buf = this.branca.decode(token);
    } catch (error) {
      return new ErrorData('unreadable', null, [error]);
    }

    const timestamp = this.branca.timestamp(token);
    const secondsElapsed = (Date.now() / 1000) - timestamp;

    if (secondsElapsed > this.validDurationSeconds) {
      return new ErrorData('expired', null, []);
    }

    let data: unknown;

    try {
      data = msgpack.decode(buf);
    } catch (error) {
      return new ErrorData('internal', null, [error]);
    }

    const ioDecodeResult = this.TokenData.decode(data);

    if ('left' in ioDecodeResult) {
      return new ErrorData('internal', reporter.report(ioDecodeResult), []);
    }

    return ioDecodeResult.right;
  }
}
