import * as io from 'io-ts';

import StorageRoot from './StorageRoot';

type IStorage = {
  read<T extends io.Mixed>(type: T, key: string): Promise<io.TypeOf<T> | undefined>;
  write<T extends io.Mixed>(_type: T, key: string, value: io.TypeOf<T>): Promise<void>;
  readRoot(): Promise<StorageRoot>;
  writeRoot(root: StorageRoot): Promise<void>;
  remove(keys: string[]): Promise<void>;
};

export default IStorage;
