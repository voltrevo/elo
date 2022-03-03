import * as ReactDOM from 'react-dom';
import Browser from 'webextension-polyfill';

import EloPage from '../elo-page/components/EloPage';
import { makeLocalExtensionAppClient } from '../elo-page/ExtensionAppClient';
import ExtensionAppContext from '../elo-page/ExtensionAppContext';
import EloPageContext, { initEloPageContext } from '../elo-page/EloPageContext';
import clientConfig from './helpers/clientConfig';
import ExtensionApp from '../elo-extension-app/ExtensionApp';
import Storage from '../elo-extension-app/storage/Storage';
import BackendApi from './BackendApi';
import GoogleAuthApi from './GoogleAuthApi';

const eloExtensionApp = makeLocalExtensionAppClient(new ExtensionApp(
  new BackendApi(`${clientConfig.tls ? 'https:' : 'http:'}//${clientConfig.hostAndPort}`),
  new GoogleAuthApi(clientConfig.googleOauthClientId),
  Browser.runtime.getURL('elo-page.html'),
  Browser.storage.local,
));

(window as any).eloExtensionApp = eloExtensionApp;

window.addEventListener('load', async () => {
  const pageCtx = initEloPageContext(new Storage(Browser.storage.local, 'elo'), clientConfig);

  const { accountRoot } = await pageCtx.storage.readRoot();
  const needsAuth = clientConfig.featureFlags.authEnabled && !accountRoot;

  pageCtx.update({
    needsAuth,
    page: needsAuth ? 'WelcomePage' : 'OverviewPage',
  });

  ReactDOM.render(
    <ExtensionAppContext.Provider value={eloExtensionApp}>
      <EloPageContext.Provider value={pageCtx}>
        <EloPage/>
      </EloPageContext.Provider>
    </ExtensionAppContext.Provider>,
    document.body,
  );
});
