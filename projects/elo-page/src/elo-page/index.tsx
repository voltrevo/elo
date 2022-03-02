import * as ReactDOM from 'react-dom';

import EloPage from './components/EloPage';
import config from './config';
import { makeLocalExtensionAppClient } from './ExtensionAppClient';
import ExtensionAppContext from './ExtensionAppContext';
import EloPageContext, { initEloPageContext } from './EloPageContext';
import SimulContentApp from './SimulContentApp';
import IRawStorage from './storage/IRawStorage';
import Storage from './storage/Storage';

const { sampleStorage } = config;

function isLocalKey(key: string) {
  return localStorage.getItem(`isLocal:${key}`) !== null;
}

function addLocalKey(key: string) {
  localStorage.setItem(`isLocal:${key}`, "true");
}

const rawStorage: IRawStorage = {
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
};

window.addEventListener('load', async () => {
  const appDiv = document.createElement('div');
  document.body.appendChild(appDiv);

  const storage = new Storage(rawStorage, 'elo');

  const eloClient = makeLocalExtensionAppClient(new SimulContentApp(storage));
  const pageCtx = initEloPageContext(storage, config);

  const { email } = await pageCtx.storage.readRoot();

  pageCtx.state.needsAuth = (
    pageCtx.config.featureFlags.authEnabled &&
    email === undefined
  );

  pageCtx.update({
    page: pageCtx.state.needsAuth ? 'WelcomePage' : 'OverviewPage',
  });

  ReactDOM.render(
    <ExtensionAppContext.Provider value={eloClient}>
      <EloPageContext.Provider value={pageCtx}>
        <EloPage/>
      </EloPageContext.Provider>
    </ExtensionAppContext.Provider>,
    appDiv,
  );
});
