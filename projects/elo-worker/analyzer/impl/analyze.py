from dataclasses import dataclass
import os
import time
from typing import Any, BinaryIO, Callable, List

import webrtcvad # type: ignore

from . import deepspeech
from .word_extractor import WordExtractor

from .types import (
  AnalysisDisfluent,
  AnalysisDisfluentFragment,
  AnalysisEndFragment,
  AnalysisFragment,
  AnalysisProgressFragment,
  AnalysisToken,
  AnalysisTokenFragment,
  AnalysisWord,
  AnalysisWordFragment,
)

home = os.getenv('HOME')

if home == "/root":
  data_dir = "/data"
else:
  data_dir = f"{home}/data/elo"

ds = deepspeech.Model(f"{data_dir}/models.tflite")
# ds.enableExternalScorer(f"{data_dir}/models.scorer")
vad: Any = webrtcvad.Vad(3)

@dataclass
class AudioChunk:
  byte_pos: int
  buffer: bytes

def analyze(
  input_stream: BinaryIO,
  on_fragment: Callable[[AnalysisFragment], None],
) -> None:
  """analyze audio from bytes
  """

  def on_token(token: AnalysisToken):
    on_fragment(AnalysisTokenFragment(
      type="token",
      value=token,
    ))
    
    word_extractor.process_token(token)

  def on_debug(message: str):
    # on_fragment(AnalysisDebugFragment(
    #   type="debug",
    #   value=AnalysisDebugFragment.Value(
    #     message=message,
    #   ),
    # ))
    pass

  def on_stream_finalize():
    word_extractor.process_stream_finalize()

  ds_stream = ds.createStream(on_token, on_debug, on_stream_finalize)
  byte_len = 0

  def on_word(word: AnalysisWord):
    on_fragment(AnalysisWordFragment(
      type="word",
      value=word,
    ))
  
  def on_disfluent(disfluent: AnalysisDisfluent):
    on_fragment(AnalysisDisfluentFragment(
      type="disfluent",
      value=disfluent,
    ))

  word_extractor = WordExtractor(on_word, on_disfluent, on_debug)
  finished = False

  voice_absent_counter = 0
  voice_absent_threshold = 30
  buffered_chunks: List[AudioChunk] = []

  audio_time = 0
  speaking_time = 0
  stream_processing_time = 0
  token_processing_time = 0
  other_start = time.perf_counter()

  while not finished:
    byte_pos = byte_len
    input_bytes = input_stream.read(960)
    byte_len += len(input_bytes)
    audio_time += len(input_bytes) / 32000

    if len(input_bytes) == 0:
      start = time.perf_counter()
      ds_stream.finalize_current()
      stream_processing_time += time.perf_counter() - start
      finished = True
    else:
      is_speech = True if len(input_bytes) < 960 else vad.is_speech(input_bytes, 16000)
      # is_speech = True

      if is_speech:
        on_debug("voice")
        voice_absent_counter = 0
      else:
        on_debug("no voice")
        voice_absent_counter += 1

        if voice_absent_counter == voice_absent_threshold:
          on_debug("voice_absent_threshold reached")
          ds_stream.finalize_current()

      if voice_absent_counter >= voice_absent_threshold:
        buffered_chunks.append(AudioChunk(byte_pos=byte_pos, buffer=input_bytes))

        while len(buffered_chunks) > voice_absent_threshold:
          buffered_chunks = buffered_chunks[1:]
      else:
        if len(buffered_chunks) > 0:
          on_debug("voice redetected, processing buffered_chunk")
          for buffered_chunk in buffered_chunks:
            start = time.perf_counter()
            ds_stream.feed_audio_content(buffered_chunk.byte_pos, buffered_chunk.buffer)
            stream_processing_time += time.perf_counter() - start
            speaking_time += len(buffered_chunk.buffer) / 32000
            buffered_chunks = []

        start = time.perf_counter()
        ds_stream.feed_audio_content(byte_pos, input_bytes)
        stream_processing_time += time.perf_counter() - start
        speaking_time += len(input_bytes) / 32000

    if audio_time >= 1:
      other_processing_time = time.perf_counter() - other_start
      other_start = time.perf_counter()

      other_processing_time -= stream_processing_time
      other_processing_time -= token_processing_time

      on_fragment(AnalysisProgressFragment(
        type="progress",
        value=AnalysisProgressFragment.Value(
          duration=byte_len / 32000,
          audio_time=audio_time,
          speaking_time=speaking_time,
          stream_processing_time=stream_processing_time,
          token_processing_time=token_processing_time,
          other_processing_time=other_processing_time,
        ),
      ))

      audio_time = 0
      speaking_time = 0
      stream_processing_time = 0
      token_processing_time = 0

  word_extractor.end()

  on_fragment(AnalysisEndFragment(
    type="end",
    value=AnalysisEndFragment.Value(
      duration=byte_len / 32000,
    ),
  ))
