import * as ReactDOM from 'react-dom';

import SessionReport from './components/SessionReport';
import Storage from './storage/Storage';
import SessionStats from './storage/SessionStats';
import ContentApp from './ContentApp';

(window as any).contentApp = new ContentApp();

window.addEventListener('load', async () => {
  const storage = new Storage('elo');

  const { lastSessionKey } = await storage.readRoot();

  if (lastSessionKey === undefined) {
    ReactDOM.render(<>No last session</>, document.body);
    return;
  }

  const lastSession = await storage.read<SessionStats>(lastSessionKey);

  if (lastSession === undefined) {
    ReactDOM.render(<>No last session</>, document.body);
    return;
  }

  ReactDOM.render(<SessionReport lastSession={lastSession} storage={storage}/>, document.body);
});
