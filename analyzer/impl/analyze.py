import os

import deepspeech # type: ignore
import numpy

from .types import Analysis
from .analyze_target_transcript import analyze_target_transcript

ds = deepspeech.Model(f"{os.getenv('HOME')}/data/deepspeech-exp/deepspeech-0.9.3-models.pbmm")

def analyze(bytes: bytes) -> Analysis:
  numpyBuffer = numpy.frombuffer(bytes, numpy.int16)
  dsAnalysis = ds.sttWithMetadata(numpyBuffer, 1), # type: ignore

  return Analysis(
    deepspeech=dsAnalysis,
    target=analyze_target_transcript(),
    duration=len(bytes) / 32000,
  )
