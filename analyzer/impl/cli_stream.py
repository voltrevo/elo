import os
import sys
from typing import Any

import deepspeech # type: ignore
import numpy # type: ignore

home = os.getenv('HOME')

if home == "/root":
  data_dir = "/data"
else:
  data_dir = f"{home}/data/deepspeech-exp"

ds = deepspeech.Model(f"{data_dir}/models.pbmm")

def run():
  ds_stream = ds.createStream()
  prev_analysis = None
  read_time = 0

  while True:
    input_bytes = sys.stdin.buffer.read(2048)
    read_time += 2048 / 32000

    if len(input_bytes) == 0:
      break

    numpy_buffer = numpy.frombuffer(input_bytes, numpy.int16)

    ds_stream.feedAudioContent(numpy_buffer) # type: ignore
    ds_analysis: Any = ds_stream.intermediateDecodeWithMetadata(1) # type: ignore

    extra_analysis = dedup_analysis(ds_analysis, prev_analysis)

    for token in extra_analysis:
      sys.stdout.write(token.text)
      sys.stdout.flush()

    prev_analysis = ds_analysis
  
  ds_finish_analysis: Any = ds_stream.finishStreamWithMetadata(1) # type: ignore
  extra_analysis = dedup_analysis(ds_finish_analysis, prev_analysis)

  for token in extra_analysis:
    sys.stdout.write(token.text)
    sys.stdout.flush()
  
  print()

def dedup_analysis(ds_analysis: Any, prev_analysis: Any):
  if prev_analysis is None:
    return ds_analysis.transcripts[0].tokens
  
  tokens = ds_analysis.transcripts[0].tokens
  prev_tokens = prev_analysis.transcripts[0].tokens

  extra_tokens: list[Any] = []

  for i in range(len(tokens)):
    if i < len(prev_tokens):
      if tokens[i].start_time == prev_tokens[i].start_time:
        pass
      else:
        extra_tokens.append(tokens[i])
    else:
      extra_tokens.append(tokens[i])
  
  return extra_tokens
