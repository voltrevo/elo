import { spawn } from 'child_process';
import { Readable as ReadableStream } from 'stream';

import pythonAnalyze, { pythonAnalyzeRaw } from './pythonAnalyze';

export type AnalysisFragment = (
  | { type: 'token', value: AnalysisToken }
  | { type: 'word', value: AnalysisWord }
  | { type: 'error', value: { message: string } }
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
    transcodeWav(webmStream),
    onFragment,
    onError,
  );
}

export function analyzeRaw(
  webmStream: ReadableStream,
): ReadableStream {
  return pythonAnalyzeRaw(transcodeWav(webmStream));
}

function transcodeWav(webmStream: ReadableStream): ReadableStream {
  const ffmpegProc = spawn(
    'ffmpeg',
    ['-i', 'pipe:', '-vn', '-ar', '16000', 'pipe:1.wav'],
    { stdio: 'pipe' },
  );

  webmStream.pipe(ffmpegProc.stdin);

  return ffmpegProc.stdout;
}
