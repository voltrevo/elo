import * as ReactDOM from 'react-dom';

import EloPage from './components/EloPage';
import { makeLocalContentAppClient } from './ContentAppClient';
import ContentAppContext from './ContentAppContext';
import EloPageContext, { initEloPageContext } from './EloPageContext';
import IRawStorage from './storage/IRawStorage';
import Storage from './storage/Storage';

const rawStorage: IRawStorage = {
  async get(key) {
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
      localStorage.setItem(key, JSON.stringify(items[key]));
    }
  },

  async remove(key) {
    localStorage.removeItem(key);
  },

  async clear() {
    localStorage.clear();
  }
};

window.addEventListener('load', async () => {
  const appDiv = document.createElement('div');
  document.body.appendChild(appDiv);

  const eloClient = makeLocalContentAppClient({} as any);
  const pageCtx = initEloPageContext(new Storage(rawStorage, 'elo'));

  pageCtx.state.page = 'AuthPage';

  ReactDOM.render(
    <ContentAppContext.Provider value={eloClient}>
      <EloPageContext.Provider value={pageCtx}>
        <EloPage/>
      </EloPageContext.Provider>
    </ContentAppContext.Provider>,
    appDiv,
  );
});
