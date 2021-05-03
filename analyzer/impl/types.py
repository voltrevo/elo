from .helpers.unexpected import Unexpected
from dataclasses import dataclass
from typing import Any, List, Optional, Union
from typing_extensions import Literal

@dataclass
class Analysis:
  deepspeech: Any
  target: Any
  duration: float

@dataclass
class TargetAnalysis:
  target_transcript: str
  speech_transcript: str
  tokens: List['AnalysisToken']

@dataclass
class AnalysisToken:
  text: Optional[str]
  start_time: Optional[float]
  type: Optional[Union[
    Literal['correct'],
    Literal['spoken-incorrect'],
    Literal['missed'],
    Unexpected,
  ]]
