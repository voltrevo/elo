import * as io from 'io-ts';

export default function Service<Name extends string, C extends io.Mixed, T>(
  service: {
    name: Name,
    Config: C,
    check?: (config: io.TypeOf<C>) => void,
    run: (config: io.TypeOf<C>, checked?: boolean) => Promise<T>,
  },
) {
  return service;
}
