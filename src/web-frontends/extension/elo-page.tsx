import * as ReactDOM from 'react-dom';

import EloPage from './components/EloPage';
import ContentApp from './ContentApp';

// import SessionReport from './components/SessionReport';
// import Storage from './storage/Storage';
// import SessionStats from './storage/SessionStats';
// import ContentApp from './ContentApp';
import { makeLocalContentAppClient } from './ContentAppClient';
import ContentAppContext from './ContentAppContext';
import EloPageContext, { initEloPageContext } from './EloPageContext';

const contentApp = makeLocalContentAppClient(new ContentApp());
(window as any).contentApp = contentApp;

window.addEventListener('load', async () => {
  const pageCtx = initEloPageContext();

  const { signupData } = await pageCtx.storage.readRoot();

  pageCtx.update({
    page: signupData ? 'LastSessionPage' : 'SignUpPage',
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
