import os
from typing import BinaryIO, Callable

import numpy

from . import deepspeech
from .types import AnalysisFragment, AnalysisTokenFragment

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

  while True:
    input_bytes = input_stream.read(2048)

    if len(input_bytes) == 0:
      break

    byte_len += len(input_bytes)

    numpyBuffer = numpy.frombuffer(input_bytes, numpy.int16)
    ds_stream.feedAudioContent(numpyBuffer)

    for token in ds_stream.get_more_tokens():
      on_fragment(AnalysisTokenFragment(
        type="token",
        value=token,
      ))

  # dsAnalysis = ds_stream.finishStreamWithMetadata(1)

  # target_transcript = supplied_target_transcript

  # if target_transcript is None:
  #   original_deepspeech_tokens = dsAnalysis.transcripts[0].tokens
  #   target_transcript = ''.join([token.text for token in original_deepspeech_tokens])

  # analysis = Analysis(
  #   deepspeech=dsAnalysis,
  #   target=analyze_target_transcript(dsAnalysis, target_transcript),
  #   disfluents=[],
  #   duration=byte_len / 32000,
  # )

  # return augment_disfluents(analysis, supplied_target_transcript is not None)
