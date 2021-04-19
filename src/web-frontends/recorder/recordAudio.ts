export type AudioRecording = {
  type: 'AudioRecording',
  blob: Blob,
};

export default async function recordAudio(): Promise<{ stop(): Promise<AudioRecording> }> {
  const recordedBlobs: BlobPart[] = [];
  const options = { mimeType: 'audio/webm;codecs=opus' };

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  const mediaRecorder = new MediaRecorder(stream, options);

  console.log('Created MediaRecorder', mediaRecorder, 'with options', options);

  const recording = new Promise<AudioRecording>(resolve => {
    mediaRecorder.onstop = (event) => {
      console.log('Recorder stopped: ', event);
      console.log('Recorded Blobs: ', recordedBlobs);
      stream.getTracks().forEach(tr => tr.stop());

      resolve({
        type: 'AudioRecording',
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
    stop: async (): Promise<AudioRecording> => {
      mediaRecorder.stop();
      return await recording;
    },
  };
}
