from dataclasses import dataclass
import re
from typing import List

from .types import AnalysisToken, TargetAnalysis
from . import deepspeech
from . import diff


def analyze_target_transcript(
  deepspeech_analysis: deepspeech.Metadata,
  target_transcript: str,
) -> TargetAnalysis:
  original_deepspeech_tokens = deepspeech_analysis.transcripts[0].tokens
  original_deepspeech_transcript = ''.join([token.text for token in original_deepspeech_tokens])

  deepspeech_tokens = [token for token in original_deepspeech_tokens if token.text != '\'']
  deepspeech_transcript = ''.join([token.text for token in deepspeech_tokens])

  raw_target_transcript_with_case = re.sub('[^a-zA-Z ]', '', target_transcript)
  raw_target_transcript = raw_target_transcript_with_case.lower()

  tokens: List[AnalysisToken] = []

  @dataclass
  class Pos:
    token = 0
    raw_target_transcript_with_case = 0
    target_transcript = 0
  
  pos = Pos()

  diff_result = diff.diff(raw_target_transcript, deepspeech_transcript)

  def sync_punctuation() -> None:
    while (
      pos.target_transcript < len(target_transcript) and
      pos.raw_target_transcript_with_case < len(raw_target_transcript_with_case) and
      target_transcript[pos.target_transcript] != raw_target_transcript_with_case[pos.raw_target_transcript_with_case]
    ):
      tokens.append(AnalysisToken(
        text=target_transcript[pos.target_transcript],
        start_time=None,
        type=None,
      ))

      pos.target_transcript += 1

  for action in diff_result:
    sync_punctuation()

    correct = not isinstance(action, (diff.Insert, diff.Remove))

    if not isinstance(action, diff.Remove):
      tokens.append(AnalysisToken(
        text=(
          deepspeech_tokens[pos.token].text if isinstance(action, diff.Insert)
          else raw_target_transcript_with_case[pos.raw_target_transcript_with_case]
        ),
        start_time=deepspeech_tokens[pos.token].start_time,
        type='correct' if correct else 'spoken-incorrect'
      ))

      pos.token += 1
    else:
      tokens.append(AnalysisToken(
        text=action.text,
        start_time=None,
        type='missed',
      ))
    
    if not isinstance(action, diff.Insert):
      pos.raw_target_transcript_with_case += 1
      pos.target_transcript += 1
  
  sync_punctuation()

  assert pos.token == len(deepspeech_transcript)

  return TargetAnalysis(
    target_transcript=target_transcript,
    speech_transcript=original_deepspeech_transcript,
    tokens=tokens,
  )
