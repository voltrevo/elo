import * as ReactDOM from 'react-dom';

import EloPage from './components/EloPage';
import config from './config';
import { makeLocalExtensionAppClient } from './ExtensionAppClient';
import ExtensionAppContext from './ExtensionAppContext';
import EloPageContext, { initEloPageContext } from './EloPageContext';
import SimulExtensionApp from './SimulExtensionApp';
import Storage from '../elo-extension-app/storage/Storage';
import RawStorage from './RawStorage';

window.addEventListener('load', async () => {
  const appDiv = document.createElement('div');
  document.body.appendChild(appDiv);

  const rawStorage = RawStorage();
  const storage = await Storage.Create(rawStorage, 'elo');

  const eloClient = makeLocalExtensionAppClient(SimulExtensionApp(rawStorage));
  const pageCtx = initEloPageContext(storage, config);

  const { accountRoot } = await pageCtx.storage.readRoot();

  pageCtx.state.needsAuth = (
    pageCtx.config.featureFlags.authEnabled &&
    accountRoot === undefined
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
