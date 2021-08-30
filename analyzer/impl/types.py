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
class AnalysisDisfluentFragment:
  type: Literal['disfluent']
  value: 'AnalysisDisfluent'

@dataclass
class AnalysisProgressFragment:
  type: Literal['progress']

  @dataclass
  class Value:
    duration: float
    audio_time: float
    stream_processing_time: float
    token_processing_time: float
    other_processing_time: float

  value: Value

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
  AnalysisDisfluentFragment,
  AnalysisProgressFragment,
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
class AnalysisDisfluent:
  start_time: Optional[float]
  end_time: Optional[float]
  category: str
  text: str

@dataclass
class AnalysisToken:
  text: Optional[str]
  start_time: Optional[float]
