namespace audio {
  export type Recording = {
    type: 'audio.Recording',
    blob: Blob,
  };

  export async function record(): Promise<{ stop(): Promise<Recording> }> {
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
          blob: new Blob(recordedBlobs, { type: 'audio/webm' }),
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
    const url = URL.createObjectURL(recording.blob);
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
