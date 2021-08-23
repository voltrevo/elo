import os
from typing import Optional

import numpy

from . import deepspeech
from .types import Analysis
from .analyze_target_transcript import analyze_target_transcript
from .augment_disfluents import augment_disfluents

home = os.getenv('HOME')

if home == "/root":
  data_dir = "/data"
else:
  data_dir = f"{home}/data/deepspeech-exp"

ds = deepspeech.Model(f"{data_dir}/models.pbmm")

def analyze(bytes: bytes, supplied_target_transcript: Optional[str] = None) -> Analysis:
  """analyze audio from bytes

  This basically just ties the different analysis together, which comes from
  analyze_target_transcript applies diffing, and augment_disfluents for disfluent detection.
  """

  numpyBuffer = numpy.frombuffer(bytes, numpy.int16)
  dsAnalysis = ds.sttWithMetadata(numpyBuffer, 1) # type: ignore

  target_transcript = supplied_target_transcript

  if target_transcript is None:
    original_deepspeech_tokens = dsAnalysis.transcripts[0].tokens
    target_transcript = ''.join([token.text for token in original_deepspeech_tokens])

  analysis = Analysis(
    deepspeech=dsAnalysis,
    target=analyze_target_transcript(dsAnalysis, target_transcript),
    disfluents=[],
    duration=len(bytes) / 32000,
  )

  return augment_disfluents(bytes, analysis, supplied_target_transcript is not None)
