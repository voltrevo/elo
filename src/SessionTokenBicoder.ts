import * as io from 'io-ts';
import msgpack from '@msgpack/msgpack';
import reporter from 'io-ts-reporters';

import createBranca, { Branca } from './helpers/createBranca';
import ErrorData from './helpers/ErrorData';

const SessionTokenData = io.type({
  userId: io.string,
});

export type SessionTokenData = io.TypeOf<typeof SessionTokenData>;

export default class SessionTokenBicoder {
  private branca: Branca;

  constructor(secret: string) {
    this.branca = createBranca(secret);
  }

  encode(tokenData: SessionTokenData) {
    return this.branca.encode(msgpack.encode(tokenData));
  }

  decode(token: string): SessionTokenData | ErrorData<'unreadable' | 'expired' | 'internal'> {
    let buf: Uint8Array;

    try {
      buf = this.branca.decode(token);
    } catch (error) {
      return new ErrorData('unreadable', null, [error]);
    }

    const timestamp = this.branca.timestamp(token);
    const secondsElapsed = (Date.now() / 1000) - timestamp;

    if (secondsElapsed > 7 * 86400) {
      return new ErrorData('expired', null, []);
    }

    let data: unknown;

    try {
      data = msgpack.decode(buf);
    } catch (error) {
      return new ErrorData('internal', null, [error]);
    }

    const ioDecodeResult = SessionTokenData.decode(data);

    if ('left' in ioDecodeResult) {
      return new ErrorData('internal', reporter.report(ioDecodeResult), []);
    }

    return ioDecodeResult.right;
  }
}
