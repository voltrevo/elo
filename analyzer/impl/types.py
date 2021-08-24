from .helpers.unexpected import Unexpected
from dataclasses import dataclass
from typing import List, Optional, Union
from typing_extensions import Literal

@dataclass
class Analysis:
  tokens: List['AnalysisToken']
  words: List['AnalysisWord']
  duration: float

@dataclass
class AnalysisTokenFragment:
  type: Literal['token']
  value: 'AnalysisToken'

@dataclass
class AnalysisWordFragment:
  type: Literal['word']
  value: 'AnalysisWord'

@dataclass
class AnalysisEndFragment:
  type: Literal['end']
  
  @dataclass
  class Value:
    duration: float
  
  value: Value

AnalysisFragment = Union[
  AnalysisTokenFragment,
  AnalysisWordFragment,
  AnalysisEndFragment,
  Unexpected,
]

@dataclass
class AnalysisWord:
  start_time: Optional[float]
  end_time: Optional[float]
  disfluent: bool
  text: str

@dataclass
class AnalysisToken:
  text: Optional[str]
  start_time: Optional[float]
  timestep: Optional[int]
