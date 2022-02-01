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
  // const storage = new Storage('elo');

  // const { lastSessionKey } = await storage.readRoot();

  // if (lastSessionKey === undefined) {
  //   ReactDOM.render(<>No last session</>, document.body);
  //   return;
  // }

  // const lastSession = await storage.read<SessionStats>(lastSessionKey);

  // if (lastSession === undefined) {
  //   ReactDOM.render(<>No last session</>, document.body);
  //   return;
  // }

  // ReactDOM.render(<SessionReport lastSession={lastSession} storage={storage}/>, document.body);

  ReactDOM.render(
    <ContentAppContext.Provider value={contentApp}>
      <EloPageContext.Provider value={initEloPageContext()}>
        <EloPage/>
      </EloPageContext.Provider>
    </ContentAppContext.Provider>,
    document.body,
  );
});
