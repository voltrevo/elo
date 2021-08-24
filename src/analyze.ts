import { spawn } from 'child_process';
import { Readable as ReadableStream } from 'stream';

import type * as deepspeech from 'deepspeech';

import pythonAnalyze from './pythonAnalyze';

export type Analysis = {
  deepspeech: deepspeech.Metadata,
  target: TargetAnalysis | null,
  disfluents: {
    start_time: number | null,
    end_time: number | null,
    text: string,
  }[]
  duration: number,
};

export type TargetAnalysis = {
  targetTranscript: string,
  speechTranscript: string,
  tokens: AnalysisToken[],
};

export type AnalysisToken = {
  text: string | null,
  timestep: number | null,
  start_time: number | null,
  type: 'correct' | 'spoken-incorrect' | 'missed' | null,
};

export default async function analyze(
  webmStream: ReadableStream,
  targetTranscript: string | null,
): Promise<Analysis> {
  const wavStream = transcodeWav(webmStream);

  return await pythonAnalyze(wavStream, targetTranscript);
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
