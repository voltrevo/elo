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

  console.log('audio constraints', constraints.audio);

  container.style.display = '';
  callbacks.onMessage({ type: 'getUserMedia-called', value: null });

  streamPromise.then(stream => {
    const audioStream = new MediaStream(stream.getAudioTracks());
    analyzeStream(
      audioStream,
      word => callbacks.onMessage({
        type: 'word',
        value: word,
      }),
    );
  });
});
