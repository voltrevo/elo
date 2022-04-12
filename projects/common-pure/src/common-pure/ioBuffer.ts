import * as io from 'io-ts';

const ioBuffer = new io.Type<Uint8Array, Uint8Array, unknown>(
  'ioBuffer',
  (u): u is Uint8Array => u instanceof Uint8Array,
  (u, c) => u instanceof Uint8Array ? io.success(u) : io.failure(u, c),
  a => a,
);

export default ioBuffer;
