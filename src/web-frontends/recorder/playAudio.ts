import { AudioRecording } from './recordAudio';

export default async function playAudio(recording: AudioRecording): Promise<void> {
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
