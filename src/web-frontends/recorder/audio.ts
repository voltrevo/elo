namespace audio {
  export type Recording = {
    type: 'audio.Recording',
    duration: number | null,
    data: Blob | File,
  };

  export type Recorder = {
    stop: () => Promise<Recording>,
  };

  export async function recordStream(): Promise<{ stream: ReadableStream, stop: () => void }> {
    const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'audio/webm;codecs=opus' });
    const blobQueue: Blob[] = [];

    const stream = new ReadableStream({
      async start(_controller) {
        mediaRecorder.onstop = (event) => {
          console.log('Recorder stopped: ', event);
          // console.log('Recorded Blobs: ', recordedBlobs);
          mediaStream.getTracks().forEach(tr => tr.stop());
        };

        mediaRecorder.ondataavailable = (event) => {
          console.log('handleDataAvailable', event);
          if (event.data && event.data.size > 0) {
            blobQueue.push(event.data);
          }
        };

        mediaRecorder.start(100);
      },
      pull(controller) {
        if (blobQueue.length > 0) {
          controller.enqueue(blobQueue.shift());
        }
      },
      cancel() {
        mediaRecorder.stop();
      }
    });

    return {
      stream,
      stop: () => { mediaRecorder.stop(); },
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
