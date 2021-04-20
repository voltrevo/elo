import * as fs from 'fs';
import { Readable as ReadableStream } from 'stream';

import * as diff from 'diff';
import * as deepspeech from 'deepspeech';
import ffmpeg from 'ffmpeg';
import { streamToBuffer } from '@jorgeferrero/stream-to-buffer';

import dirs from './dirs';
import assert from './helpers/assert';

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
  targetTranscript?: AnalysisToken[],
};

export type AnalysisToken = deepspeech.TokenMetadata & { correct?: boolean };

export default async function analyze(
  webmStream: ReadableStream,
  targetTranscript: string | null,
): Promise<Analysis> {
  const deepspeechAnalysis = await analyzeDeepspeech(webmStream);
  const analysis: Analysis = { deepspeech: deepspeechAnalysis };

  if (targetTranscript) {
    analysis.targetTranscript = analyzeTargetTranscript(deepspeechAnalysis, targetTranscript);
  }

  return analysis;
}

function analyzeTargetTranscript(
  deepspeechAnalysis: Analysis['deepspeech'],
  targetTranscript: string,
): AnalysisToken[] {
  const deepspeechTranscript = deepspeechAnalysis.transcripts[0].tokens.map(t => t.text).join('');

  const hunks = diff.diffChars(targetTranscript, deepspeechTranscript);

  const analysis: AnalysisToken[] = [];
  let tokenPos = 0;

  for (const hunk of hunks) {
    for (const _c of hunk.value) {
      if (hunk.removed) {
        continue;
      }

      analysis.push({
        ...deepspeechAnalysis.transcripts[0].tokens[tokenPos],
        correct: !hunk.added,
      });

      tokenPos++;
    }
  }

  assert(tokenPos === deepspeechTranscript.length);

  return analysis;
}

async function analyzeDeepspeech(webmStream: ReadableStream): Promise<Analysis['deepspeech']> {
  const webmFile = `${dirs.data}/recordings/${Date.now()}.webm`;
  const wavFile = webmFile.replace(/\.webm$/, '.wav');

  const buffer = await streamToBuffer(webmStream);
  await fs.promises.writeFile(webmFile, buffer);

  const ffmpegCtx = (await (new ffmpeg(webmFile)));
  ffmpegCtx.setDisableVideo();
  ffmpegCtx.setAudioFrequency(16000);
  await ffmpegCtx.save(wavFile);

  const output = model.sttWithMetadata(
    await fs.promises.readFile(wavFile),
  );

  return output;
}
