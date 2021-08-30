import * as preact from 'preact';
import analyzeStream from './analyzeStream';
import Callbacks from './Callbacks';

import App from './components/App';
import interceptGetUserMedia from './interceptGetUserMedia';

const languageConfidenceExtension = document.querySelector('#language-confidence-extension')!;

const container = document.createElement('div');
container.style.display = 'none';
languageConfidenceExtension.appendChild(container);

const callbacks: Callbacks = {
  onMessage: () => {},
};

preact.render(<App callbacks={callbacks}/>, container);

interceptGetUserMedia(({ constraints, streamPromise }) => {
  if (!constraints.audio) {
    return; // Ignore intercepts without audio
  }

  container.style.display = '';
  callbacks.onMessage({ type: 'getUserMedia-called', value: null });

  streamPromise.then(async stream => {
    const audioStream = new MediaStream(stream.getAudioTracks());

    while (true) {
      callbacks.onMessage({ type: 'connecting', value: null });

      await analyzeStream(
        audioStream,
        {
          onConnected: () => callbacks.onMessage({ type: 'connected', value: null }),
          onWord: word => callbacks.onMessage({
            type: 'word',
            value: word,
          }),
        },
      );

      const streamAlive = audioStream.getTracks().some(t => t.readyState !== 'ended');

      if (!streamAlive) {
        break;
      }

      console.log('Fluency terminated even though the stream is still going. Restarting in 3s.');
      callbacks.onMessage({ type: 'reconnecting', value: null });
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  });
});
