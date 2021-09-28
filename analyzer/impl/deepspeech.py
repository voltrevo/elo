from dataclasses import dataclass
from typing import Any, Callable, List

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

  def createStream(self,
    on_token: Callable[[AnalysisToken], None],
    on_debug: Callable[[str], None]
  ):
    return ModelStream(self.ds, on_token, on_debug)


# About every 10 seconds we just nuke the stream and make it start again fresh
# Enhancements:
# - rewind on reset to avoid mistakes
# - reset at intelligent points like when deepspeech emits a space
max_chunks_per_reset = 150


class ModelStream:
  last_token_start: float = -1
  chunks_since_reset = 0
  chunk_time = 0
  time_offset = 0
  processed_byte_pos = 0 # includes skipped bytes

  def __init__(self,
    ds: deepspeech.Model,
    on_token: Callable[[AnalysisToken], None],
    on_debug: Callable[[str], None],
  ):
    self.ds = ds
    self.on_token = on_token
    self.on_debug = on_debug
    self.stream = ds.createStream()

  def feed_audio_content(self, byte_pos: int, audio_buffer: bytes) -> None:
    if byte_pos > self.processed_byte_pos:
      self.on_debug("resetting on audio gap")
      self.reset(byte_pos / 32000)

    numpyBuffer = numpy.frombuffer(audio_buffer, numpy.int16) # type: ignore
    self.stream.feedAudioContent(numpyBuffer) # type: ignore
    self.chunks_since_reset += 1
    self.chunk_time += len(audio_buffer) / 32000

    if self.chunks_since_reset >= max_chunks_per_reset:
      self.on_debug("resetting on max chunks")
      self.reset(self.time_offset + self.chunk_time)
    else:
      self.emit_new_tokens(self.stream.intermediateDecodeWithMetadata(1)) # type: ignore

    self.processed_byte_pos += len(audio_buffer)

  def emit_new_tokens(self, metadata: Any):
    for token in metadata.transcripts[0].tokens:
      if token.start_time <= self.last_token_start:
        continue

      self.last_token_start = token.start_time

      self.on_token(AnalysisToken(
        text=token.text,
        start_time=self.time_offset + token.start_time,
      ))

  def reset(self, new_time_offset: float):
    self.finalize_current()
    self.chunks_since_reset = 0
    self.time_offset = new_time_offset
    self.chunk_time = 0

    self.last_token_start = -1

    self.stream = self.ds.createStream()
    self.on_debug("model reset")

  def finalize_current(self) -> None:
    self.emit_new_tokens(self.stream.finishStreamWithMetadata(1)) # type: ignore
