import EventEmitter from 'events';

import browser from 'webextension-polyfill';
import * as tb from 'typed-bytes';
import TypedEmitter from 'typed-emitter';

type Storage = browser.Storage.StorageAreaSync;

type ChangeEmitterClass<T> = new() => TypedEmitter<{ change(newValue: T): void }>;

function StorageField<T>(storage: Storage, fieldName: string, defaultValue: T) {
  return new (class extends (EventEmitter as ChangeEmitterClass<T>) {
    data?: { value: T };

    constructor() {
      // eslint-disable-next-line constructor-super
      super();

      (async () => {
        const storedData = await storage.get(fieldName);

        if (fieldName in storedData) {

        }
      })();
    }

    async read() {}
  })();
}

class Wrapper<T> {
  // eslint-disable-next-line class-methods-use-this
  wrapped(value: T) {
    return StorageField<T>({} as Storage, '', value);
  }
}

type StorageField<T> = ReturnType<Wrapper<T>['wrapped']>;

export default StorageField;
