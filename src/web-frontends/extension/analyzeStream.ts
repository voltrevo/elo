import { AnalysisDisfluent, AnalysisFragment, AnalysisWord } from '../../analyze';
import never from '../../helpers/never';

const maxLatency = 2; // seconds

export default async function analyzeStream(
  stream: MediaStream,
  callbacks: {
    onConnected: () => void,
    onWord: (word: AnalysisWord) => void,
    onDisfluent: (disfluent: AnalysisDisfluent) => void,
  },
) {
  const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const webSocket = new WebSocket(`${wsProto}//${process.env.API_HOST_AND_PORT}/analyze`);

  await new Promise(resolve => { webSocket.onopen = resolve; });
  callbacks.onConnected();

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
    clearTimeout(latencyTimeoutId);

    finishedResolver!();
  }

  mediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      webSocket.send(event.data);
    }
  };

  mediaRecorder.onstop = cleanup;

  mediaRecorder.onerror = (error) => {
    console.error('mediaRecorder error', error);
    cleanup();
  };

  const startTime = Date.now();

  let latencyTimeoutId = -1;

  const resetLatencyTimeout = () => {
    clearTimeout(latencyTimeoutId);

    latencyTimeoutId = window.setTimeout(() => {
      console.debug('fluency', 'Latency timeout');
      cleanup();
    }, (maxLatency + 1) * 1000);

    // Adding 1 second above because progress messages only come once per second, so the first
    // second of delay is expected
  };

  resetLatencyTimeout();

  webSocket.onmessage = evt => {
    resetLatencyTimeout();
    const fragment: AnalysisFragment = JSON.parse(evt.data);

    switch (fragment.type) {
      case 'token': {
        break;
      }

      case 'word': {
        callbacks.onWord(fragment.value);
        break;
      }

      case 'disfluent': {
        callbacks.onDisfluent(fragment.value);
        break;
      }

      case 'progress': {
        const duration = (Date.now() - startTime) / 1000;
        const latency = duration - fragment.value.duration;

        if (latency > maxLatency) {
          console.error('fluency', 'reached max latency, resetting connection');
          cleanup();
        }

        break;
      }

      case 'error': {
        console.error('fluency', 'Transcription error', fragment.value.message);
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
