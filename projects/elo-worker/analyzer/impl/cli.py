from .types import AnalysisFragment
import dataclasses
import json
import sys

from .analyze import analyze

def run():
  def on_fragment(fragment: AnalysisFragment):
    print(json.dumps(dataclasses.asdict(fragment)), flush=True)

  analyze(sys.stdin.buffer, on_fragment)
