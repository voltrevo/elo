import { spawn } from 'child_process';
import { Readable as ReadableStream } from 'stream';
import { AnalysisFragment } from '../elo-types/Analysis';

import pythonAnalyze, { pythonAnalyzeRaw } from './pythonAnalyze';

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
