import os
from typing import BinaryIO, Callable

import numpy

from . import deepspeech
from .word_extractor import WordExtractor
from .types import AnalysisEndFragment, AnalysisFragment, AnalysisTokenFragment, AnalysisWord, AnalysisWordFragment

home = os.getenv('HOME')

if home == "/root":
  data_dir = "/data"
else:
  data_dir = f"{home}/data/deepspeech-exp"

ds = deepspeech.Model(f"{data_dir}/models.pbmm")

def analyze(
  input_stream: BinaryIO,
  on_fragment: Callable[[AnalysisFragment], None],
) -> None:
  """analyze audio from bytes

  This basically just ties the different analysis together, which comes from
  analyze_target_transcript applies diffing, and augment_disfluents for disfluent detection.
  """

  ds_stream = ds.createStream()
  byte_len = 0

  def on_word(word: AnalysisWord):
    on_fragment(AnalysisWordFragment(
      type="word",
      value=word,
    ))

  word_extractor = WordExtractor(on_word)
  finished = False

  while not finished:
    input_bytes = input_stream.read(2048)
    byte_len += len(input_bytes)

    if len(input_bytes) == 0:
      ds_stream.finish()
      finished = True
    else:
      numpyBuffer = numpy.frombuffer(input_bytes, numpy.int16)
      ds_stream.feedAudioContent(numpyBuffer)

    for token in ds_stream.get_more_tokens():
      on_fragment(AnalysisTokenFragment(
        type="token",
        value=token,
      ))

      word_extractor.process_token(token)

  word_extractor.end()

  on_fragment(AnalysisEndFragment(
    type="end",
    value=AnalysisEndFragment.Value(
      duration=byte_len / 32000,
    ),
  ))
