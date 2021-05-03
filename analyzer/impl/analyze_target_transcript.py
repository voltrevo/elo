import re
from typing import Any, List

from .types import AnalysisToken, TargetAnalysis
from . import diff


def analyze_target_transcript(
  deepspeech_analysis: Any,
  target_transcript: str,
) -> TargetAnalysis:
  original_deepspeech_tokens = deepspeech_analysis.transcripts[0].tokens
  original_deepspeech_transcript = ''.join([token.text for token in original_deepspeech_tokens])

  deepspeech_tokens = [token for token in original_deepspeech_tokens if token.text != '\'']
  deepspeech_transcript = ''.join([token.text for token in deepspeech_tokens])

  raw_target_transcript_with_case = re.sub('[^a-zA-Z ]', '', target_transcript)
  raw_target_transcript = raw_target_transcript_with_case.lower()

  tokens: List[AnalysisToken] = []
  token_pos = 0
  raw_target_transcript_with_case_pos = 0
  target_transcript_pos = 0

  diff_result = diff.diff(raw_target_transcript, deepspeech_transcript)

  def sync_punctuation() -> None:
    while (
      target_transcript_pos < len(target_transcript) and
      target_transcript[target_transcript_pos] != raw_target_transcript_with_case[raw_target_transcript_with_case_pos]
    ):
      tokens.append(AnalysisToken(
        text=target_transcript[target_transcript_pos],
        start_time=None,
        type=None,
      ))

  for action in diff_result:
    sync_punctuation()

    correct = not isinstance(action, (diff.Insert, diff.Remove))

    if not isinstance(action, diff.Remove):
      tokens.append(AnalysisToken(
        text=(
          deepspeech_tokens[token_pos].text if isinstance(action, diff.Insert)
          else raw_target_transcript_with_case[raw_target_transcript_with_case_pos]
        ),
        start_time=deepspeech_tokens[token_pos].start_time,
        type='correct' if correct else 'spoken-incorrect'
      ))

      token_pos += 1
    else:
      tokens.append(AnalysisToken(
        text=action.text,
        start_time=None,
        type='missed',
      ))
    
    if not isinstance(action, diff.Insert):
      raw_target_transcript_with_case_pos += 1
      target_transcript_pos += 1
  
  sync_punctuation()

  assert token_pos == len(deepspeech_transcript)

  return TargetAnalysis(
    target_transcript=target_transcript,
    speech_transcript=original_deepspeech_transcript,
    tokens=tokens,
  )
