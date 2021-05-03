import os
from typing import Optional

import numpy

from . import deepspeech
from .types import Analysis
from .analyze_target_transcript import analyze_target_transcript
from .augment_disfluents import augment_disfluents

ds = deepspeech.Model(f"{os.getenv('HOME')}/data/deepspeech-exp/deepspeech-0.9.3-models.pbmm")

def analyze(bytes: bytes, target_transcript: Optional[str] = None) -> Analysis:
  numpyBuffer = numpy.frombuffer(bytes, numpy.int16)
  dsAnalysis = ds.sttWithMetadata(numpyBuffer, 1) # type: ignore

  analysis = Analysis(
    deepspeech=dsAnalysis,
    target=None if target_transcript is None else analyze_target_transcript(dsAnalysis, target_transcript),
    duration=len(bytes) / 32000,
  )

  return augment_disfluents(analysis)
