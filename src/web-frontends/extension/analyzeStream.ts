import { AnalysisFragment, AnalysisWord } from '../../analyze';
import never from '../../helpers/never';

export default async function analyzeStream(
  stream: MediaStream,
  onWord: (word: AnalysisWord) => void,
) {
  const wsProto = window.location.protocol === 'https' ? 'wss' : 'ws';
  const webSocket = new WebSocket(`${wsProto}://${process.env.API_HOST_AND_PORT}/analyze`);

  webSocket.onerror = (error) => {
    console.error('webSocket error', error);
  };

  await new Promise(resolve => webSocket.addEventListener('open', resolve));
  console.log('webSocket opened');

  const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });

  let bytesSent = 0;

  mediaRecorder.ondataavailable = (event) => {
    // console.log('handleDataAvailable', event);
    if (event.data && event.data.size > 0) {
      webSocket.send(event.data);
      bytesSent += event.data.size;
      // console.log({ bytesSent, buffered: webSocket.bufferedAmount });
    } else if (event.data && event.data.size === 0) {
      console.log('Got empty blob from mediaRecorder');
    }
  };

  mediaRecorder.onstop = () => {
    console.log('mediaRecorder stopped');
  };

  mediaRecorder.onerror = (error) => {
    console.error('mediaRecorder error', error);
  };

  webSocket.addEventListener('message', evt => {
    const fragment: AnalysisFragment = JSON.parse(evt.data);

    switch (fragment.type) {
      case 'token': {
        // console.log(fragment.value);
        break;
      }

      case 'word': {
        onWord(fragment.value);

        break;
      }

      case 'progress': {
        // Enhancement: Latency monitoring
        break;
      }

      case 'error': {
        console.error('Transcription error', fragment.value.message);
        break;
      }

      case 'end': {
        console.log('Transcription end');
        break;
      }

      default: {
        never(fragment);
      }
    }
  });

  mediaRecorder.start(100);
}
