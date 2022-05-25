import * as ReactDOM from 'react-dom';

import EloPage from './components/EloPage';
import config from './config';
import { makeLocalExtensionAppClient } from './ExtensionAppClient';
import ExtensionAppContext from './ExtensionAppContext';
import EloPageContext, { initEloPageContext } from './EloPageContext';
import SimulExtensionApp from './SimulExtensionApp';
import DeviceStorage from '../elo-extension-app/deviceStorage/DeviceStorage';
import RawStorage from './RawStorage';
import syncPageAndHash from './syncPageAndHash';

window.addEventListener('load', async () => {
  const appDiv = document.createElement('div');
  document.body.appendChild(appDiv);

  const rawStorage = RawStorage();
  const deviceStorage = await DeviceStorage.Create(rawStorage, 'elo');

  const eloExtensionApp = SimulExtensionApp(deviceStorage);
  (window as any).eloExtensionApp = eloExtensionApp;

  const eloClient = makeLocalExtensionAppClient(eloExtensionApp);
  const pageCtx = initEloPageContext(deviceStorage, config.featureFlags, location.hash.slice(1));
  syncPageAndHash(pageCtx);

  const { accountRoot } = await pageCtx.deviceStorage.readRoot();

  pageCtx.state.needsAuth = (
    pageCtx.featureFlags.authEnabled &&
    accountRoot === undefined
  );

  if (pageCtx.state.hash === '') {
    pageCtx.update({
      hash: pageCtx.state.needsAuth ? 'WelcomePage' : 'OverviewPage',
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
