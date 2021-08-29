import { spawn } from 'child_process';
import { Readable as ReadableStream } from 'stream';

import pythonAnalyze, { pythonAnalyzeRaw } from './pythonAnalyze';

export type AnalysisFragment = (
  | { type: 'token', value: AnalysisToken }
  | { type: 'word', value: AnalysisWord }
  | { type: 'error', value: { message: string } }
  | { type: 'progress', value: {
    duration: number,
    audio_time: number,
    stream_processing_time: number,
    token_processing_time: number,
    other_processing_time: number,
  } }
  | { type: 'end', value: { duration: number } }
);

export type Analysis = {
  tokens: AnalysisToken[],
  words: AnalysisWord[],
  duration: number,
  complete: boolean,
};

export type AnalysisWord = {
  start_time: number | null,
  end_time: number | null,
  disfluent: boolean,
  text: string,
};

export type AnalysisToken = {
  text: string | null,
  start_time: number | null,
};

export default function analyze(
  webmStream: ReadableStream,
  onFragment: (fragment: AnalysisFragment) => void,
  onError: (error: Error) => void,
) {
  return pythonAnalyze(
    transcodeWav(webmStream, onError),
    onFragment,
    onError,
  );
}

export function analyzeRaw(
  webmStream: ReadableStream,
  onError: (error: Error) => void,
): ReadableStream {
  return pythonAnalyzeRaw(transcodeWav(webmStream, onError), onError);
}

function transcodeWav(
  webmStream: ReadableStream,
  onError: (error: Error) => void,
): ReadableStream {
  const ffmpegProc = spawn(
    'ffmpeg',
    ['-i', 'pipe:', '-vn', '-ar', '16000', 'pipe:1.wav'],
    { stdio: ['pipe', 'pipe', 'inherit'] },
  );

  ffmpegProc.on('error', onError);

  ffmpegProc.on('exit', code => {
    if (code !== 0) {
      onError(new Error(`Non-zero exit code from ffmpeg (${code})`));
    }
  });

  webmStream.pipe(ffmpegProc.stdin);

  return ffmpegProc.stdout;
}
