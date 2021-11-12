import * as preact from 'preact';

import SessionReport from './components/SessionReport';
import ReportPrototype from './components/ReportPrototype';
import Storage from './storage/Storage';
import SessionStats from './storage/SessionStats';
import ContentApp from './ContentApp';

(window as any).contentApp = new ContentApp();

window.addEventListener('load', async () => {
  const storage = new Storage('elo');

  const { lastSessionKey } = await storage.readRoot();

  if (lastSessionKey === undefined) {
    preact.render(<>No last session</>, document.body);
    return;
  }

  const lastSession = await storage.read<SessionStats>(lastSessionKey);

  if (lastSession === undefined) {
    preact.render(<>No last session</>, document.body);
    return;
  }

  preact.render(<SessionReport lastSession={lastSession} storage={storage}/>, document.body);
});
