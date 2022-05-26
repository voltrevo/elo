import * as ReactDOM from 'react-dom';
import Browser from 'webextension-polyfill';

import EloPage from '../elo-page/components/EloPage';
import { makeLocalExtensionAppClient } from '../elo-page/ExtensionAppClient';
import ExtensionAppContext from '../elo-page/ExtensionAppContext';
import EloPageContext, { initEloPageContext } from '../elo-page/EloPageContext';
import config from './config';
import ExtensionApp from '../elo-extension-app/ExtensionApp';
import DeviceStorage from '../elo-extension-app/deviceStorage/DeviceStorage';
import BackendApi from './BackendApi';
import GoogleAuthApi from './GoogleAuthApi';
import syncPageAndHash from '../elo-page/syncPageAndHash';
import makeStorageClient from './makeStorageClient';

window.addEventListener('load', async () => {
  const deviceStorage = await DeviceStorage.Create(Browser.storage.local, 'elo');

  const apiBase = `${config.tls ? 'https:' : 'http:'}//${config.hostAndPort}`;

  const eloExtensionApp = makeLocalExtensionAppClient(new ExtensionApp(
    new BackendApi(apiBase),
    new GoogleAuthApi(config.googleOauthClientId),
    Browser.runtime.getURL('elo-page.html'),
    deviceStorage,
    (eloLoginToken) => makeStorageClient(apiBase, eloLoginToken),
  ));

  (window as any).eloExtensionApp = eloExtensionApp;

  const pageCtx = initEloPageContext(deviceStorage, config.featureFlags, location.hash.slice(1));
  syncPageAndHash(pageCtx);

  const { accountRoot } = await pageCtx.deviceStorage.readRoot();
  const needsAuth = config.featureFlags.authEnabled && !accountRoot;
  pageCtx.state.needsAuth = needsAuth;

  if (pageCtx.state.hash === '') {
    pageCtx.update({
      needsAuth,
      hash: needsAuth ? 'WelcomePage' : 'OverviewPage',
    });
  }

  ReactDOM.render(
    <ExtensionAppContext.Provider value={eloExtensionApp}>
      <EloPageContext.Provider value={pageCtx}>
        <EloPage/>
      </EloPageContext.Provider>
    </ExtensionAppContext.Provider>,
    document.getElementById('react-container'),
  );
});
