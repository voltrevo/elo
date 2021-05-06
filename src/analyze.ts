import * as fs from 'fs';
import { Readable as ReadableStream } from 'stream';

import type * as deepspeech from 'deepspeech';
import ffmpeg from 'ffmpeg';
import { streamToBuffer } from '@jorgeferrero/stream-to-buffer';

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
  const webmFile = `${pathBase}.webm`;
  const wavFile = `${pathBase}.wav`;

  const buffer = await streamToBuffer(webmStream);
  await fs.promises.writeFile(webmFile, buffer);

  const ffmpegCtx = (await (new ffmpeg(webmFile)));
  ffmpegCtx.setDisableVideo();
  ffmpegCtx.setAudioFrequency(16000);
  await ffmpegCtx.save(wavFile);

  const wavBuffer = await fs.promises.readFile(wavFile);

  await fs.promises.unlink(webmFile);
  await fs.promises.unlink(wavFile);

  return wavBuffer;
}
