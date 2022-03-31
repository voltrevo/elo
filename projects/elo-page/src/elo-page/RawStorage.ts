import IRawStorage from "../elo-extension-app/storage/IRawStorage";
import config from './config';

const { sampleStorage } = config;

function isLocalKey(key: string) {
  return localStorage.getItem(`isLocal:${key}`) !== null;
}

function addLocalKey(key: string) {
  localStorage.setItem(`isLocal:${key}`, "true");
}

export default function RawStorage(): IRawStorage {
  return {
    async get(key) {
      if (key === undefined) {
        const result = JSON.parse(JSON.stringify(sampleStorage));

        for (const k of Object.keys(localStorage)) {
          if (k.startsWith('isLocal:')) {
            const localKey = k.slice('isLocal:'.length);

            const localValue = JSON.parse(localStorage.getItem(localKey)!);

            if (localValue === null) {
              delete result[localKey];
            } else {
              result[localKey] = JSON.parse(localStorage.getItem(localKey)!);
            }
          }
        }

        return result;
      }

      if (!isLocalKey(key)) {
        const sampleValue = sampleStorage[key];
  
        if (sampleValue === undefined) {
          return {};
        }
  
        return {
          [key]: JSON.parse(JSON.stringify(sampleValue)),
        };
      }
  
      const localValue = localStorage.getItem(key);
  
      if (localValue === null) {
        return {};
      }
  
      return {
        [key]: JSON.parse(localValue),
      };
    },
  
    async set(items) {
      for (const key of Object.keys(items)) {
        addLocalKey(key);
        localStorage.setItem(key, JSON.stringify(items[key]));
      }
    },
  
    async remove(keys) {
      for (const k of keys) {
        addLocalKey(k);
        localStorage.removeItem(k);
      }
    },
  
    async clear() {
      localStorage.clear();
    }
  }
}