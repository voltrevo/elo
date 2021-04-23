import * as fs from 'fs';
import { Readable as ReadableStream } from 'stream';

import * as deepspeech from 'deepspeech';
import ffmpeg from 'ffmpeg';
import { streamToBuffer } from '@jorgeferrero/stream-to-buffer';
import * as musicMetadata from 'music-metadata';

import dirs from './dirs';
import assertExists from './helpers/assertExists';
import analyzeTargetTranscript, { TargetAnalysis } from './analyzeTargetTranscript';

function totalTime(hrtimeValue: number[]): string {
  return (hrtimeValue[0] + hrtimeValue[1] / 1000000000).toPrecision(4);
}

const modelPath = `${dirs.data}/deepspeech-0.9.3-models.pbmm`;

console.error('Loading model from file %s', modelPath);
const modelLoadStart = process.hrtime();
const model = new deepspeech.Model(modelPath);
const modelLoadEnd = process.hrtime(modelLoadStart);
console.error('Loaded model in %ds.', totalTime(modelLoadEnd));

export type Analysis = {
  deepspeech: deepspeech.Metadata,
  target?: TargetAnalysis,
  duration: number,
};

export type AnalysisToken = Partial<deepspeech.TokenMetadata & {
  type: 'correct' | 'spoken-incorrect' | 'missed',
}>;

export default async function analyze(
  webmStream: ReadableStream,
  targetTranscript: string | null,
): Promise<Analysis> {
  const wavFile = await getWavFile(webmStream);

  const metadata = await musicMetadata.parseFile(wavFile, { duration: true });

  const deepspeechAnalysis = await analyzeDeepspeech(wavFile);

  const analysis: Analysis = {
    deepspeech: deepspeechAnalysis,
    duration: assertExists(metadata.format.duration),
  };

  if (targetTranscript) {
    analysis.target = analyzeTargetTranscript(deepspeechAnalysis, targetTranscript);
  }

  return analysis;
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

async function analyzeDeepspeech(wavFile: string): Promise<Analysis['deepspeech']> {
  const output = model.sttWithMetadata(
    await fs.promises.readFile(wavFile),
  );

  return output;
}
