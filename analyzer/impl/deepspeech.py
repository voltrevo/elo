from dataclasses import dataclass
from typing import Any, List

import deepspeech # type: ignore

from .types import AnalysisToken

@dataclass
class Metadata:
  transcripts: List['CandidateTranscript']

@dataclass
class CandidateTranscript:
  confidence: float
  tokens: List['TokenMetadata']

@dataclass
class TokenMetadata:
  text: str
  timestep: int
  start_time: float

def parse(ds_metadata: Any) -> Metadata:
  metadata = Metadata(transcripts=[])

  for ds_transcript in ds_metadata.transcripts:
    transcript = CandidateTranscript(
      confidence=ds_transcript.confidence,
      tokens=[],
    )

    for ds_token in ds_transcript.tokens:
      token = TokenMetadata(
        text=ds_token.text,
        timestep=ds_token.timestep,
        start_time=ds_token.start_time,
      )

      transcript.tokens.append(token)

    metadata.transcripts.append(transcript)

  return metadata


class Model:
  def __init__(self, model_path: str):
    self.ds = deepspeech.Model(model_path)

  def sttWithMetadata(self, audio_buffer: bytes, max_results: int) -> Metadata:
    ds_metadata = self.ds.sttWithMetadata(audio_buffer, max_results) # type: ignore
    return parse(ds_metadata)

  def enableExternalScorer(self, scorer_path: str):
    self.ds.enableExternalScorer(scorer_path) # type: ignore

  def createStream(self):
    return ModelStream(self.ds.createStream())

class ModelStream:
  last_token_start: float = -1
  last_metadata: Any = None

  def __init__(self, stream: deepspeech.Stream):
    self.stream = stream

  def feedAudioContent(self, audio_buffer: bytes) -> None:
    self.stream.feedAudioContent(audio_buffer) # type: ignore

  def get_more_tokens(self) -> List[AnalysisToken]:
    metadata: Any = None
    
    if self.last_metadata is not None:
      metadata = self.last_metadata
    else:
      metadata = self.stream.intermediateDecodeWithMetadata(1) # type: ignore

    new_tokens: List[AnalysisToken] = []

    for token in metadata.transcripts[0].tokens:
      if token.start_time <= self.last_token_start:
        continue

      self.last_token_start = token.start_time

      new_tokens.append(AnalysisToken(
        text=token.text,
        start_time=token.start_time,
      ))

    return new_tokens

  def finish(self) -> None:
    self.last_metadata = self.stream.finishStreamWithMetadata(1) # type: ignore
