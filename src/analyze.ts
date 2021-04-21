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

type TargetAnalysis = {
  targetTranscript: string,
  speechTranscript: string,
  tokens: AnalysisToken[],
};

export type Analysis = {
  deepspeech: deepspeech.Metadata,
  target?: TargetAnalysis,
};

export type AnalysisToken = Partial<deepspeech.TokenMetadata & {
  type: 'correct' | 'spoken-incorrect' | 'missed',
}>;

export default async function analyze(
  webmStream: ReadableStream,
  targetTranscript: string | null,
): Promise<Analysis> {
  const deepspeechAnalysis = await analyzeDeepspeech(webmStream);
  const analysis: Analysis = { deepspeech: deepspeechAnalysis };

  if (targetTranscript) {
    analysis.target = analyzeTargetTranscript(deepspeechAnalysis, targetTranscript);
  }

  return analysis;
}

function analyzeTargetTranscript(
  deepspeechAnalysis: Analysis['deepspeech'],
  targetTranscript: string,
): TargetAnalysis {
  const deepspeechTranscript = deepspeechAnalysis.transcripts[0].tokens.map(t => t.text).join('');

  const rawTargetTranscriptWithCase = targetTranscript.replace(/[^a-zA-Z ]/g, '');
  const rawTargetTranscript = rawTargetTranscriptWithCase.toLowerCase();

  const hunks = diff.diffChars(rawTargetTranscript, deepspeechTranscript);

  const tokens: AnalysisToken[] = [];
  let tokenPos = 0;
  let rawTargetTranscriptWithCasePos = 0;
  let targetTranscriptPos = 0;

  function syncPunctuation() {
    while (
      targetTranscriptPos < targetTranscript.length &&
      targetTranscript[targetTranscriptPos] !==
      rawTargetTranscriptWithCase[rawTargetTranscriptWithCasePos]
    ) {
      tokens.push({
        text: targetTranscript[targetTranscriptPos],
      });

      targetTranscriptPos++;
    }
  }

  for (const hunk of hunks) {
    for (const c of hunk.value) {
      syncPunctuation();
      const correct = !hunk.added && !hunk.removed;

      if (!hunk.removed) {
        tokens.push({
          ...deepspeechAnalysis.transcripts[0].tokens[tokenPos],
          text: hunk.added
            ? deepspeechAnalysis.transcripts[0].tokens[tokenPos].text
            : rawTargetTranscriptWithCase[rawTargetTranscriptWithCasePos],
          type: correct ? 'correct' : 'spoken-incorrect',
        });

        tokenPos++;
      } else {
        tokens.push({
          text: c,
          type: 'missed',
        });
      }

      if (!hunk.added) {
        rawTargetTranscriptWithCasePos++;
        targetTranscriptPos++;
      }
    }
  }

  syncPunctuation();

  assert(tokenPos === deepspeechTranscript.length);

  return {
    targetTranscript,
    speechTranscript: deepspeechTranscript,
    tokens,
  };
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
