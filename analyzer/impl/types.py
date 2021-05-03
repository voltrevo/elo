from dataclasses import dataclass
from typing import Any

@dataclass
class Analysis:
  deepspeech: Any
  target: Any
  duration: float

@dataclass
class TargetAnalysis:
  pass
