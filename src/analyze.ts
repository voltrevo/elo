import { spawn } from 'child_process';
import * as fs from 'fs';
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
  const buffer = await getWavBuffer(webmStream);

  return await pythonAnalyze(buffer, targetTranscript);
}

function tempFilename() {
  return `${Date.now()}-${Math.random().toString().slice(2)}`;
}

async function getWavBuffer(webmStream: ReadableStream) {
  const pathBase = `/tmp/${tempFilename()}`;
  const wavFile = `${pathBase}.wav`;

  const ffmpegProc = spawn(
    'ffmpeg',
    ['-i', 'pipe:', '-vn', '-ar', '16000', 'pipe:1.wav'],
    { stdio: ['pipe', 'pipe', 'inherit'] },
  );

  webmStream.pipe(ffmpegProc.stdin);
  ffmpegProc.stdout.pipe(fs.createWriteStream(wavFile));

  await new Promise(resolve => ffmpegProc.on('exit', resolve));

  const wavBuffer = await fs.promises.readFile(wavFile);

  return wavBuffer;
}
