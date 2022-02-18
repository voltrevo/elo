import * as ReactDOM from 'react-dom';

import EloPage from './components/EloPage';
import config from './config';
import { makeLocalContentAppClient } from './ContentAppClient';
import ContentAppContext from './ContentAppContext';
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
  appDiv.style.fontSize = '12px'; // This is the default in extensions (?)
  appDiv.style.width = '100vw';
  appDiv.style.height = '100vh';
  document.body.appendChild(appDiv);

  const eloClient = makeLocalContentAppClient(new SimulContentApp());
  const pageCtx = initEloPageContext(new Storage(rawStorage, 'elo'), config.featureFlags);

  const { registrationData } = await pageCtx.storage.readRoot();
  const needsAuth = pageCtx.featureFlags.authEnabled && !registrationData;

  pageCtx.update({
    page: needsAuth ? 'AuthPage' : 'OverviewPage',
  });

  ReactDOM.render(
    <ContentAppContext.Provider value={eloClient}>
      <EloPageContext.Provider value={pageCtx}>
        <EloPage/>
      </EloPageContext.Provider>
    </ContentAppContext.Provider>,
    appDiv,
  );
});
