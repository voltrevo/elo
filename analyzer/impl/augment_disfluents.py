from dataclasses import dataclass
from typing import List, Optional
from .types import Analysis, AnalysisToken, TargetAnalysis

pause_threshold = 0.8

def augment_disfluents(analysis: Analysis) -> Analysis:
  if analysis.target is None:
    return analysis

  words = get_words(analysis.target.tokens)
  words = annotate_disfluents(words)
  words = add_pauses(words)

  tokens: List[AnalysisToken] = []

  for word in words:
    if word.space_before is not None:
      tokens.append(word.space_before)

    for token in word.tokens:
      tokens.append(token)

  return Analysis(
    deepspeech=analysis.deepspeech,
    target=TargetAnalysis(
      target_transcript=analysis.target.target_transcript,
      speech_transcript=analysis.target.speech_transcript,
      tokens=tokens,
    ),
    duration=analysis.duration,
  )

@dataclass
class Word:
  text: str
  start_time: Optional[float]
  end_time: Optional[float]
  space_before: Optional[AnalysisToken]
  tokens: List[AnalysisToken]
  errors: int

def get_words(tokens: List[AnalysisToken]) -> List[Word]:
  words: List[Word] = []
  partial_word: List[AnalysisToken] = []
  space_before: Optional[AnalysisToken] = None

  def append_word():
    if len(partial_word) != 0:
      start_time = None
      end_time = None

      for t in partial_word:
        if t.start_time is None:
          continue

        if start_time is None:
          start_time = t.start_time
        
        end_time = t.start_time

      words.append(Word(
        text=''.join(['' if t.text is None else t.text for t in partial_word]),
        start_time=start_time,
        end_time=end_time,
        space_before=space_before,
        tokens=[t for t in partial_word],
        errors=len([t for t in partial_word if t.type in {'spoken-incorrect', 'missed'}]),
      ))

      partial_word.clear()

  for token in tokens:
    if token.text == ' ':
      append_word()
      space_before = token
    else:
      partial_word.append(token)

  append_word()

  return words

def annotate_disfluents(words: List[Word]) -> List[Word]:
  whitelist = {'um', 'uh', 'a', 'ho', 'ah', 'an', 'am', 'm', 'ar'}

  new_words: List[Word] = []

  for i in range(len(words)):
    word = words[i]

    is_disfluent = (
      word.text in whitelist and
      word.errors == len(word.text)
      # TODO: Check neighbouring words are ok?
    )

    if not is_disfluent:
      new_words.append(word)
      continue
      
    new_word = Word(
      text=f"<{word.text}>",
      start_time=word.start_time,
      end_time=word.end_time,
      space_before=word.space_before,
      tokens=[],
      errors=word.errors,
    )

    new_word.tokens.append(AnalysisToken(
      text='<',
      start_time=None,
      type='spoken-incorrect'
    ))

    for t in word.tokens:
      new_word.tokens.append(t)

    new_word.tokens.append(AnalysisToken(
      text='>',
      start_time=None,
      type='spoken-incorrect'
    ))

    new_words.append(new_word)
  
  return new_words

def add_pauses(words: List[Word]) -> List[Word]:
  new_words: List[Word] = []
  last_end_time: Optional[float] = None

  for word in words:
    if last_end_time is not None and word.start_time is not None:
      gap = word.start_time - last_end_time

      if gap >= pause_threshold:
        new_words.append(Word(
          text='<pause>',
          start_time=last_end_time + 0.05,
          end_time=word.start_time - 0.05,
          space_before=AnalysisToken(
            text=' ',
            start_time=word.start_time - 0.025,
            type=None,
          ),
          tokens=[
            AnalysisToken(
              text='<',
              start_time=last_end_time + 0.05,
              type='spoken-incorrect',
            ),
            AnalysisToken(
              text='pause',
              start_time=None,
              type='spoken-incorrect',
            ),
            AnalysisToken(
              text='>',
              start_time=word.start_time - 0.05,
              type='spoken-incorrect',
            ),
          ],
          errors=len('<pause>'),
        ))

    new_words.append(word)
    last_end_time = word.end_time

  return new_words
