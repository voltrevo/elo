from dataclasses import dataclass
from typing import Any, List

import deepspeech # type: ignore
import numpy

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
    return ModelStream(self.ds)


# About every 10 seconds we just nuke the stream and make it start again fresh
# Enhancements:
# - rewind on reset to avoid mistakes
# - reset at intelligent points like when deepspeech emits a space
chunks_per_reset = 150


class ModelStream:
  last_token_start: float = -1
  last_metadata: Any = None
  chunks_since_reset = 0
  chunk_time = 0
  time_offset = 0

  def __init__(self, ds: deepspeech.Model):
    self.ds = ds
    self.stream = ds.createStream()

  def feedAudioContent(self, audio_buffer: bytes) -> None:
    numpyBuffer = numpy.frombuffer(audio_buffer, numpy.int16)
    self.stream.feedAudioContent(numpyBuffer) # type: ignore
    self.chunks_since_reset += 1
    self.chunk_time += len(audio_buffer) / 32000

  def get_more_tokens(self) -> List[AnalysisToken]:
    metadata: Any = None
    do_reset = False

    if self.last_metadata is not None:
      metadata = self.last_metadata
    else:
      if self.chunks_since_reset < chunks_per_reset:
        metadata = self.stream.intermediateDecodeWithMetadata(1) # type: ignore
      else:
        do_reset = True
        metadata = self.stream.finishStreamWithMetadata(1) # type: ignore

    new_tokens: List[AnalysisToken] = []

    for token in metadata.transcripts[0].tokens:
      if token.start_time <= self.last_token_start:
        continue

      self.last_token_start = token.start_time

      new_tokens.append(AnalysisToken(
        text=token.text,
        start_time=self.time_offset + token.start_time,
      ))

    if do_reset:
      self.reset()

    return new_tokens
  
  def reset(self):
    self.chunks_since_reset = 0
    self.time_offset += self.chunk_time
    self.chunk_time = 0

    self.last_token_start = -1
    self.last_metadata = None

    self.stream = self.ds.createStream()

  def finish(self) -> None:
    self.last_metadata = self.stream.finishStreamWithMetadata(1) # type: ignore
