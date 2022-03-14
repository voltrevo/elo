import * as ReactDOM from 'react-dom';
import Browser from 'webextension-polyfill';

import EloPage from '../elo-page/components/EloPage';
import { makeLocalExtensionAppClient } from '../elo-page/ExtensionAppClient';
import ExtensionAppContext from '../elo-page/ExtensionAppContext';
import EloPageContext, { initEloPageContext } from '../elo-page/EloPageContext';
import config from './config';
import ExtensionApp from '../elo-extension-app/ExtensionApp';
import Storage from '../elo-extension-app/storage/Storage';
import BackendApi from './BackendApi';
import GoogleAuthApi from './GoogleAuthApi';

const eloExtensionApp = makeLocalExtensionAppClient(new ExtensionApp(
  new BackendApi(`${config.tls ? 'https:' : 'http:'}//${config.hostAndPort}`),
  new GoogleAuthApi(config.googleOauthClientId),
  Browser.runtime.getURL('elo-page.html'),
  Browser.storage.local,
));

(window as any).eloExtensionApp = eloExtensionApp;

window.addEventListener('load', async () => {
  const pageCtx = initEloPageContext(new Storage(Browser.storage.local, 'elo'), config);

  const { accountRoot } = await pageCtx.storage.readRoot();
  const needsAuth = config.featureFlags.authEnabled && !accountRoot;

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
