import * as ReactDOM from 'react-dom';
import { makeLocalContentAppClient } from '../elo-page/ContentAppClient';
import ContentAppContext from '../elo-page/ContentAppContext';

import EloPage from './components/EloPage';
import ContentApp from './ContentApp';

import EloPageContext, { initEloPageContext } from './EloPageContext';
import clientConfig from './helpers/clientConfig';

const contentApp = makeLocalContentAppClient(new ContentApp());
(window as any).contentApp = contentApp;

window.addEventListener('load', async () => {
  const pageCtx = initEloPageContext();

  const { registrationData } = await pageCtx.storage.readRoot();
  const needsAuth = clientConfig.featureFlags.authEnabled && !registrationData;

  pageCtx.update({
    page: needsAuth ? 'AuthPage' : 'LastSessionPage',
  });

  ReactDOM.render(
    <ContentAppContext.Provider value={contentApp}>
      <EloPageContext.Provider value={pageCtx}>
        <EloPage/>
      </EloPageContext.Provider>
    </ContentAppContext.Provider>,
    document.body,
  );
});
