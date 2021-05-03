import os

import deepspeech # type: ignore
import numpy

from .types import Analysis

ds = deepspeech.Model(f"{os.getenv('HOME')}/data/deepspeech-exp/deepspeech-0.9.3-models.pbmm")

def analyze(bytes: bytes) -> Analysis:
  numpyBuffer = numpy.frombuffer(bytes, numpy.int16)
  dsAnalysis = ds.sttWithMetadata(numpyBuffer, 1), # type: ignore

  return Analysis(
    deepspeech=dsAnalysis
  )
