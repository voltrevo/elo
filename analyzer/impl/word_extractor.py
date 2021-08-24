from typing import Callable, List, Optional

from .types import AnalysisToken, AnalysisWord


empty_disfluent = '<?>'

disfluents = {
  empty_disfluent,
  'um', 'uh', 'un', 'ho', 'ah', 'm', 'ar', 'rn',
  # 'a', 'an', 'am', 'ham',
}

pause_threshold = 0.8

class WordExtractor:
  partial_word: List[AnalysisToken] = []
  space_before: Optional[AnalysisToken] = None
  last_end_time: Optional[float] = None

  def __init__(self, on_word: Callable[[AnalysisWord], None]):
    self.on_word = on_word

  def process_token(self, token: AnalysisToken):
    if token.text == ' ':
      self.append_word(token)
      self.space_before = token
    else:
      self.partial_word.append(token)

  def end(self):
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
      start_time - self.last_end_time >= pause_threshold
    ):
      self.on_word(AnalysisWord(
        start_time=self.last_end_time + 0.05,
        end_time=start_time - 0.05,
        disfluent=True,
        text="<pause>",
      ))

    text = ''.join(['' if t.text is None else t.text for t in self.partial_word])

    if text == '':
      text = empty_disfluent

    self.on_word(AnalysisWord(
      start_time=start_time,
      end_time=end_time,
      disfluent=text in disfluents,
      text=text,
    ))

    self.last_end_time = end_time
    self.partial_word.clear()
