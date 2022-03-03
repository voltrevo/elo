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
      if (!isLocalKey(key)) {
        const sampleValue = sampleStorage[key];
  
        if (sampleValue === undefined) {
          return {};
        }
  
        return {
          [key]: sampleValue,
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
  
    async remove(key) {
      addLocalKey(key);
      localStorage.removeItem(key);
    },
  
    async clear() {
      localStorage.clear();
    }
  }
}