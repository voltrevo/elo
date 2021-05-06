from .helpers.unexpected import Unexpected
from dataclasses import dataclass
from typing import List, Optional, Union
from typing_extensions import Literal
from . import deepspeech

@dataclass
class Analysis:
  deepspeech: deepspeech.Metadata
  target: Optional['TargetAnalysis']
  disfluents: List['Disfluent']
  duration: float

@dataclass
class Disfluent:
  start_time: Optional[float]
  end_time: Optional[float]
  text: str

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
