import { AnalysisFragment, AnalysisWord } from '../../analyze';
import never from '../../helpers/never';

export default async function analyzeStream(
  stream: MediaStream,
  onWord: (word: AnalysisWord) => void,
) {
  const wsProto = window.location.protocol === 'https' ? 'wss' : 'ws';
  const webSocket = new WebSocket(`${wsProto}://${process.env.API_HOST_AND_PORT}/analyze`);
  // console.log('opening websocket');

  await new Promise(resolve => { webSocket.onopen = resolve; });
  // console.log('websocket opened');

  const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });

  webSocket.onerror = (error) => {
    console.error('webSocket error', error);
    cleanup();
  };

  let tracksEndedPollingId: number | undefined = undefined;

  let finishedResolver: (() => void) | null = null;

  const finished = new Promise<void>(resolve => {
    finishedResolver = resolve;
  });

  function cleanup() {
    if (webSocket.readyState === WebSocket.OPEN) {
      webSocket.close();
    }

    webSocket.onmessage = null;

    if (mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }

    mediaRecorder.ondataavailable = null;

    clearInterval(tracksEndedPollingId);

    finishedResolver!();
  }

  // let bytesSent = 0;

  mediaRecorder.ondataavailable = (event) => {
    // console.log('handleDataAvailable', event);
    if (event.data && event.data.size > 0) {
      webSocket.send(event.data);
      // bytesSent += event.data.size;
      // console.log({ bytesSent, buffered: webSocket.bufferedAmount });
    }
  };

  mediaRecorder.onstop = cleanup;

  mediaRecorder.onerror = (error) => {
    console.error('mediaRecorder error', error);
    cleanup();
  };

  const startTime = Date.now();

  webSocket.onmessage = evt => {
    const fragment: AnalysisFragment = JSON.parse(evt.data);

    if ('duration' in fragment.value) {
      const duration = (Date.now() - startTime) / 1000;
      const latency = duration - fragment.value.duration;
      // console.log({ duration, latency });
    }

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
        cleanup();
        break;
      }

      case 'end': {
        cleanup();
        break;
      }

      default: {
        never(fragment);
      }
    }
  };

  mediaRecorder.start(100);

  webSocket.onclose = cleanup;

  const tracks = stream.getAudioTracks();

  // Polling because the ended event is not firing. WebRTC bug I guess 🤷‍♂️.
  tracksEndedPollingId = window.setInterval(() => {
    const tracksEnded = tracks.filter(t => t.readyState === 'ended').length;

    if (tracksEnded === tracks.length) {
      clearInterval(tracksEndedPollingId);
      cleanup();
    }
  }, 1000);

  return finished;
}
