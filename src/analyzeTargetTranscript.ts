import type * as deepspeech from 'deepspeech-gpu';
import * as diff from 'diff';

import assert from './helpers/assert';
import type { AnalysisToken } from './analyze';

export type TargetAnalysis = {
  targetTranscript: string,
  speechTranscript: string,
  tokens: AnalysisToken[],
};

export default function analyzeTargetTranscript(
  deepspeechAnalysis: deepspeech.Metadata,
  targetTranscript: string,
): TargetAnalysis {
  const originalDeepspeechTokens = deepspeechAnalysis.transcripts[0].tokens;
  const originalDeepspeechTranscript = originalDeepspeechTokens.map(t => t.text).join('');

  const deepspeechTokens = originalDeepspeechTokens.filter(t => t.text !== '\'');
  const deepspeechTranscript = deepspeechTokens.map(t => t.text).join('');

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
          ...deepspeechTokens[tokenPos],
          text: hunk.added
            ? deepspeechTokens[tokenPos].text
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
    speechTranscript: originalDeepspeechTranscript,
    tokens,
  };
}
