import * as ReactDOM from 'react-dom';
import { ThirdPartyExtensionAppClient } from '../elo-page/ExtensionAppClient';
import { ThirdPartyExtensionAppContext } from '../elo-page/ExtensionAppContext';

import PostMessageClient from '../elo-page/helpers/PostMessageClient';
import analyzeStream from './analyzeStream';
import App from './components/App';
import interceptGetUserMedia from './interceptGetUserMedia';

const eloExtension = document.querySelector('#elo-extension')!;

const container = document.createElement('div');
container.style.display = 'none';
eloExtension.appendChild(container);

const contentApp = ThirdPartyExtensionAppClient(new PostMessageClient('elo'));

ReactDOM.render(
  <ThirdPartyExtensionAppContext.Provider value={contentApp}>
    <App/>
  </ThirdPartyExtensionAppContext.Provider>,
  container,
);

interceptGetUserMedia(async ({ constraints, streamPromise }) => {
  if (!constraints.audio) {
    return; // Ignore intercepts without audio
  }

  container.style.display = '';
  await contentApp.notifyGetUserMediaCalled();

  const sessionToken = await contentApp.getSessionToken();

  if (sessionToken === undefined) {
    console.warn('Aborting due to missing sessionToken');
    return;
  }

  streamPromise.then(async stream => {
    const audioStream = new MediaStream(stream.getAudioTracks());

    while (true) {
      contentApp.addConnectionEvent('connecting');

      try {
        await analyzeStream(sessionToken, audioStream, contentApp);
      } catch (error) {
        console.error('elo', error);
      }

      const streamAlive = audioStream.getTracks().some(t => t.readyState !== 'ended');

      if (!streamAlive) {
        break;
      }

      console.log('Elo terminated even though the stream is still going. Restarting in 3s.');
      contentApp.addConnectionEvent('reconnecting');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  });
});
