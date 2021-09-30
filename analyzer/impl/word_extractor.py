from typing import Callable, List, Optional, Set

from .types import AnalysisDisfluent, AnalysisToken, AnalysisWord


empty_disfluent = '<?>'

disfluents = {
  'filler': {
    empty_disfluent,
    'um', 'uh', 'un', 'ho', 'ah', 'm', 'ar', 'rn', 'er', 'earh', 'eh',
    # 'a', 'an', 'am', 'ham',
  },
  'undesirable': {
    'you know', 'like',
    # 'so',
    'ok so', 'i mean',
    'literally',
  },
  'confirmation': {
    'ok', 'okay', 'o kay', 'a kay',
  },
  'hedge': {
    'i guess', 'i suppose',
    'kind of',
  }
}

all_disfluents: Set[str] = set()

for category in disfluents:
  for disfluent in disfluents[category]:
    all_disfluents.add(disfluent)

pause_min = 0.8
pause_max = 2

class WordExtractor:
  previous_word: Optional[AnalysisWord] = None
  partial_word: List[AnalysisToken] = []
  space_before: Optional[AnalysisToken] = None
  last_end_time: Optional[float] = None
  chunks_since_token = 0
  phantom_space_mode = False

  def __init__(
    self,
    on_word: Callable[[AnalysisWord], None],
    on_disfluent: Callable[[AnalysisDisfluent], None],
    on_debug: Callable[[str], None],
  ):
    self.on_word = on_word
    self.on_disfluent = on_disfluent
    self.on_debug = on_debug

  def process_token(self, token: AnalysisToken):
    self.chunks_since_token = 0

    if token.text == ' ':
      if not self.phantom_space_mode:
        self.append_word(token)
      self.space_before = token
    else:
      self.partial_word.append(token)

    self.phantom_space_mode = False
  
  def process_stream_finalize(self):
    if len(self.partial_word) > 0:
      self.append_word(None)
      self.phantom_space_mode = True
      self.on_debug("chopping word in WordExtractor")

  def end(self):
    if not self.phantom_space_mode:
      self.append_word(None)

  def append_word(self, next_space: Optional[AnalysisToken]):
    start_time = None
    end_time = None

    tokens = [t for t in self.partial_word]

    if len(tokens) == 0:
      start_time = None if self.space_before is None else self.space_before.start_time
      end_time = None if next_space is None else next_space.start_time

    for t in tokens:
      if t.start_time is None:
        continue

      if start_time is None:
        start_time = t.start_time

      end_time = t.start_time
    
    if (
      self.last_end_time is not None and
      start_time is not None and
      start_time - self.last_end_time >= pause_min and
      start_time - self.last_end_time <= pause_max
    ):
      self.on_word(AnalysisWord(
        start_time=self.last_end_time + 0.05,
        end_time=start_time - 0.05,
        disfluent=True,
        text='<pause>',
      ))

      self.on_disfluent(AnalysisDisfluent(
        start_time=self.last_end_time + 0.05,
        end_time=start_time - 0.05,
        category='filler',
        text='<pause>',
      ))

    text = ''.join(['' if t.text is None else t.text for t in self.partial_word])

    if text == '':
      text = empty_disfluent
    
    analysis_word = AnalysisWord(
      start_time=start_time,
      end_time=end_time,
      disfluent=text in all_disfluents,
      text=text,
    )

    self.on_word(analysis_word)

    for category in disfluents:
      for disfluent in disfluents[category]:
        comparison_text = text
        disfluent_start_time = start_time

        if ' ' in disfluent and self.previous_word is not None:
          comparison_text = f'{self.previous_word.text} {comparison_text}'
          disfluent_start_time = self.previous_word.start_time
        
        if comparison_text == disfluent:
          self.on_disfluent(AnalysisDisfluent(
            start_time=disfluent_start_time,
            end_time=end_time,
            category=category,
            text=disfluent,
          ))

    self.previous_word = analysis_word
    self.last_end_time = end_time
    self.partial_word.clear()
