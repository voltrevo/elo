import * as preact from 'preact';
import playAudio from './playAudio';

import recordAudio from './recordAudio';

window.addEventListener('load', () => {
  preact.render(<div>Hello world!</div>, document.body);
});

(window as any).recordAudio = recordAudio;
(window as any).playAudio = playAudio;
