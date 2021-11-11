import * as preact from 'preact';

import PostMessageClient from '../helpers/PostMessageClient';
import analyzeStream from './analyzeStream';
import App from './components/App';
import ContentAppClient from './ContentAppClient';
import interceptGetUserMedia from './interceptGetUserMedia';

const eloExtension = document.querySelector('#elo-extension')!;

const container = document.createElement('div');
container.style.display = 'none';
eloExtension.appendChild(container);

const contentApp = ContentAppClient(new PostMessageClient('elo'));

preact.render(<App contentApp={contentApp}/>, container);

interceptGetUserMedia(({ constraints, streamPromise }) => {
  if (!constraints.audio) {
    return; // Ignore intercepts without audio
  }

  container.style.display = '';
  contentApp.notifyGetUserMediaCalled();

  streamPromise.then(async stream => {
    const audioStream = new MediaStream(stream.getAudioTracks());

    while (true) {
      contentApp.addConnectionEvent('connecting');

      try {
        await analyzeStream(audioStream, contentApp);
      } catch (error) {
        console.error('fluency', error);
      }

      const streamAlive = audioStream.getTracks().some(t => t.readyState !== 'ended');

      if (!streamAlive) {
        break;
      }

      console.log('Fluency terminated even though the stream is still going. Restarting in 3s.');
      contentApp.addConnectionEvent('reconnecting');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  });
});
