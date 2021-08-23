namespace audio {
  export type Recording = {
    type: 'audio.Recording',
    duration: number | null,
    data: Blob | File,
  };

  export type Recorder = {
    stop: () => Promise<Recording>,
  };

  export type StreamingRecorder = {
    stream: ReadableStream<Uint8Array>,
    stop: () => Promise<Recording>,
  };

  export async function recordStream(): Promise<StreamingRecorder> {
    const startTime = Date.now();
    const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recordedBlobs: BlobPart[] = [];
    const mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'audio/webm;codecs=opus' });
    const blobQueue: Blob[] = [];

    const recording = new Promise<Recording>(resolve => {
      mediaRecorder.onstop = (event) => {
        console.log('Recorder stopped: ', event);
        console.log('Recorded Blobs: ', recordedBlobs);
        mediaStream.getTracks().forEach(tr => tr.stop());

        resolve({
          type: 'audio.Recording',
          duration: Date.now() - startTime,
          data: new Blob(recordedBlobs, { type: 'audio/webm' }),
        });
      };
    });

    const stream = new ReadableStream<Uint8Array>({
      async start(_controller) {
        mediaRecorder.ondataavailable = (event) => {
          console.log('handleDataAvailable', event);
          if (event.data && event.data.size > 0) {
            recordedBlobs.push(event.data);
            blobQueue.push(event.data);
          }
        };

        mediaRecorder.start(100);
      },
      async pull(controller) {
        const blob = blobQueue.shift();

        if (blob) {
          controller.enqueue(new Uint8Array(await blob.arrayBuffer()));
        }
      },
      cancel() {
        mediaRecorder.stop();
      }
    });

    return {
      stream,
      stop: async () => {
        mediaRecorder.stop();
        return await recording;
      },
    };
  }

  export async function record(): Promise<Recorder> {
    const startTime = Date.now();
    const recordedBlobs: BlobPart[] = [];
    const options = { mimeType: 'audio/webm;codecs=opus' };

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const mediaRecorder = new MediaRecorder(stream, options);

    console.log('Created MediaRecorder', mediaRecorder, 'with options', options);

    const recording = new Promise<Recording>(resolve => {
      mediaRecorder.onstop = (event) => {
        console.log('Recorder stopped: ', event);
        console.log('Recorded Blobs: ', recordedBlobs);
        stream.getTracks().forEach(tr => tr.stop());

        resolve({
          type: 'audio.Recording',
          duration: Date.now() - startTime,
          data: new Blob(recordedBlobs, { type: 'audio/webm' }),
        });
      };
    });

    mediaRecorder.ondataavailable = (event) => {
      console.log('handleDataAvailable', event);
      if (event.data && event.data.size > 0) {
        recordedBlobs.push(event.data);
      }
    };

    mediaRecorder.start();
    console.log('MediaRecorder started', mediaRecorder);

    return {
      stop: async (): Promise<Recording> => {
        mediaRecorder.stop();
        return await recording;
      },
    };
  }

  export async function play(recording: Recording): Promise<void> {
    const audioElement = document.createElement('audio');
    audioElement.setAttribute('controls', '');
    const url = URL.createObjectURL(recording.data);
    audioElement.src = url;

    document.body.append(audioElement);

    await audioElement.play();

    return await new Promise<void>(resolve => {
      audioElement.onended = () => {
        URL.revokeObjectURL(url);
        audioElement.remove();
        resolve();
      };
    });
  }
}

export default audio;
