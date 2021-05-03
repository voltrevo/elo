import * as fs from 'fs';
import { Readable as ReadableStream } from 'stream';

import * as deepspeech from 'deepspeech';
import ffmpeg from 'ffmpeg';
import { streamToBuffer } from '@jorgeferrero/stream-to-buffer';

import dirs from './dirs';
import pythonAnalyze from './pythonAnalyze';

export type Analysis = {
  deepspeech: deepspeech.Metadata,
  target?: TargetAnalysis,
  duration: number,
};

export type TargetAnalysis = {
  targetTranscript: string,
  speechTranscript: string,
  tokens: AnalysisToken[],
};

export type AnalysisToken = Partial<deepspeech.TokenMetadata & {
  type: 'correct' | 'spoken-incorrect' | 'missed',
}>;

export default async function analyze(
  webmStream: ReadableStream,
  targetTranscript: string | null,
): Promise<Analysis> {
  const wavFile = await getWavFile(webmStream);
  const buffer = await fs.promises.readFile(wavFile);

  return await pythonAnalyze(buffer, targetTranscript);
}

async function getWavFile(webmStream: ReadableStream) {
  const webmFile = `${dirs.data}/recordings/${Date.now()}.webm`;
  const wavFile = webmFile.replace(/\.webm$/, '.wav');

  const buffer = await streamToBuffer(webmStream);
  await fs.promises.writeFile(webmFile, buffer);

  const ffmpegCtx = (await (new ffmpeg(webmFile)));
  ffmpegCtx.setDisableVideo();
  ffmpegCtx.setAudioFrequency(16000);
  await ffmpegCtx.save(wavFile);

  return wavFile;
}
