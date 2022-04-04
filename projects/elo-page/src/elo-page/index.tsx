import * as ReactDOM from 'react-dom';

import EloPage from './components/EloPage';
import config from './config';
import { makeLocalExtensionAppClient } from './ExtensionAppClient';
import ExtensionAppContext from './ExtensionAppContext';
import EloPageContext, { initEloPageContext } from './EloPageContext';
import SimulExtensionApp from './SimulExtensionApp';
import Storage from '../elo-extension-app/storage/Storage';
import RawStorage from './RawStorage';
import syncPageAndHash from './syncPageAndHash';

window.addEventListener('load', async () => {
  const appDiv = document.createElement('div');
  document.body.appendChild(appDiv);

  const rawStorage = RawStorage();
  const storage = await Storage.Create(rawStorage, 'elo');

  const eloExtensionApp = SimulExtensionApp(storage);
  (window as any).eloExtensionApp = eloExtensionApp;

  const eloClient = makeLocalExtensionAppClient(eloExtensionApp);
  const pageCtx = initEloPageContext(storage, config.featureFlags, location.hash.slice(1));
  syncPageAndHash(pageCtx);

  const { accountRoot } = await pageCtx.storage.readRoot();

  pageCtx.state.needsAuth = (
    pageCtx.featureFlags.authEnabled &&
    accountRoot === undefined
  );

  if (pageCtx.state.page === '') {
    pageCtx.update({
      page: pageCtx.state.needsAuth ? 'WelcomePage' : 'OverviewPage',
    });
  }

  ReactDOM.render(
    <ExtensionAppContext.Provider value={eloClient}>
      <EloPageContext.Provider value={pageCtx}>
        <EloPage/>
      </EloPageContext.Provider>
    </ExtensionAppContext.Provider>,
    appDiv,
  );
});
