import * as io from 'io-ts';
import reporter from 'io-ts-reporters';

export default function decode<T extends io.Mixed>(type: T, value: unknown): io.TypeOf<T> {
  const ioDecodeResult = type.decode(value);

  if ('left' in ioDecodeResult) {
    throw new Error(reporter.report(ioDecodeResult).join('\n'));
  }

  return ioDecodeResult.right;
}
