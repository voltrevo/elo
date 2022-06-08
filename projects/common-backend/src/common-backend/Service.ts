import * as io from 'io-ts';

export default function Service<Name extends string, C extends io.Mixed, T>(
  service: { name: Name, Config: C, run: (config: io.TypeOf<C>) => Promise<T> },
) {
  return service;
}
