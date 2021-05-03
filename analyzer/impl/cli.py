import argparse
import dataclasses
import json
import sys

from .analyze import analyze

def run():
  parser = argparse.ArgumentParser(description='Fluency CLI')

  parser.add_argument('--target_transcript')

  args = parser.parse_args()

  bytes = sys.stdin.buffer.read(50000000)
  result = analyze(bytes, args.target_transcript)

  print(json.dumps(dataclasses.asdict(result)))
