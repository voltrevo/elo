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

def analyze(bytes: bytes, target_transcript: Optional[str] = None) -> Analysis:
  """analyze audio from bytes

  This basically just ties the different analysis together, which comes from
  analyze_target_transcript applies diffing, and augment_disfluents for disfluent detection.
  """

  numpyBuffer = numpy.frombuffer(bytes, numpy.int16)
  dsAnalysis = ds.sttWithMetadata(numpyBuffer, 1) # type: ignore

  analysis = Analysis(
    deepspeech=dsAnalysis,
    target=None if target_transcript is None else analyze_target_transcript(dsAnalysis, target_transcript),
    disfluents=[],
    duration=len(bytes) / 32000,
  )

  return augment_disfluents(bytes, analysis)
