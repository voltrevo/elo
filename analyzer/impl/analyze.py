import os
import time
from typing import Any, BinaryIO, Callable

import webrtcvad # type: ignore

from . import deepspeech
from .word_extractor import WordExtractor
from .types import AnalysisDebugFragment, AnalysisDisfluent, AnalysisDisfluentFragment, AnalysisEndFragment, AnalysisFragment, AnalysisProgressFragment, AnalysisToken, AnalysisTokenFragment, AnalysisWord, AnalysisWordFragment

home = os.getenv('HOME')

if home == "/root":
  data_dir = "/data"
else:
  data_dir = f"{home}/data/deepspeech-exp"

ds = deepspeech.Model(f"{data_dir}/models.pbmm")
vad: Any = webrtcvad.Vad(3)

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
    on_fragment(AnalysisDebugFragment(
      type="debug",
      value=AnalysisDebugFragment.Value(
        message=message,
      ),
    ))

  ds_stream = ds.createStream(on_token, on_debug)
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

  word_extractor = WordExtractor(on_word, on_disfluent)
  finished = False

  audio_time = 0
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
      start = time.perf_counter()
      ds_stream.feed_audio_content(byte_pos, input_bytes)
      stream_processing_time += time.perf_counter() - start
    
    word_extractor.process_chunk_end()
    
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
          stream_processing_time=stream_processing_time,
          token_processing_time=token_processing_time,
          other_processing_time=other_processing_time,
        ),
      ))

      audio_time = 0
      stream_processing_time = 0
      token_processing_time = 0

  word_extractor.end()

  on_fragment(AnalysisEndFragment(
    type="end",
    value=AnalysisEndFragment.Value(
      duration=byte_len / 32000,
    ),
  ))
