import os
import sys
from typing import Any

import deepspeech # type: ignore
import numpy

ds = deepspeech.Model(f"{os.getenv('HOME')}/data/deepspeech-exp/deepspeech-0.9.3-models.pbmm")

bytes = sys.stdin.buffer.read(50000000)
numpyBuffer = numpy.frombuffer(bytes, numpy.int16)

result: Any = ds.sttWithMetadata(numpyBuffer, 1) # type: ignore

print(result)
