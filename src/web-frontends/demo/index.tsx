import * as preact from 'preact';

import App from './App';
import audio from './audio';

window.addEventListener('load', () => {
  preact.render(<App/>, document.body);
});

(window as any).audio = audio;

(window as any).audio5s = async () => {
  const recorder = await audio.record();
  console.log('Recording...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  const recording = await recorder.stop();
  console.log('Stopped, playing...');
  await audio.play(recording);
  console.log('Played');
};