# import math
from dataclasses import dataclass
from typing import List, Optional
from .types import Analysis, AnalysisToken, Disfluent, TargetAnalysis

pause_threshold = 0.8

def augment_disfluents(bytes: bytes, analysis: Analysis) -> Analysis:
  if analysis.target is None:
    return analysis
  
  disfluents: List[Disfluent] = []

  words = get_words(analysis.target.tokens, disfluents)
  words = annotate_disfluents(words, disfluents)
  words = add_pauses(bytes, words, disfluents)

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
    disfluents=disfluents,
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

def get_words(tokens: List[AnalysisToken], disfluents: List[Disfluent]) -> List[Word]:
  words: List[Word] = []
  partial_word: List[AnalysisToken] = []
  space_before: Optional[AnalysisToken] = None

  def append_word(next_space: Optional[AnalysisToken]):
    start_time = None
    end_time = None

    tokens = [t for t in partial_word]

    if len(tokens) == 0:
      start_time = None if space_before is None else space_before.start_time
      end_time = None if next_space is None else next_space.start_time

      tokens = [
        AnalysisToken(
          text='<?',
          start_time=start_time,
          type='spoken-incorrect',
        ),
        AnalysisToken(
          text='>',
          start_time=end_time,
          type='spoken-incorrect',
        ),
      ]

      disfluents.append(Disfluent(
        start_time=start_time,
        end_time=end_time,
        text='?',
      ))

    for t in tokens:
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
      tokens=tokens,
      errors=len([t for t in partial_word if t.type in {'spoken-incorrect', 'missed'}]),
    ))

    partial_word.clear()

  for token in tokens:
    if token.text == ' ':
      append_word(token)
      space_before = token
    else:
      partial_word.append(token)

  append_word(None)

  return words

def annotate_disfluents(words: List[Word], disfluents: List[Disfluent]) -> List[Word]:
  whitelist = {'um', 'uh', 'a', 'ho', 'ah', 'an', 'am', 'm', 'ar', 'ham'}

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

    disfluents.append(Disfluent(
      start_time=word.start_time,
      end_time=word.end_time,
      text=word.text,
    ))

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

def add_pauses(bytes: bytes, words: List[Word], disfluents: List[Disfluent]) -> List[Word]:
  new_words: List[Word] = []
  last_end_time: Optional[float] = None

  for word in words:
    if last_end_time is not None and word.start_time is not None:
      gap = word.start_time - last_end_time

      if gap >= pause_threshold:
        # gapBytes = bytes[
        #   2 * math.floor(last_end_time * 16000):
        #   2 * math.floor(word.start_time * 16000)
        # ]

        # gapVolume = avg_volume(gapBytes)

        start_time = last_end_time + 0.05
        end_time = word.start_time - 0.05

        new_words.append(Word(
          text=f'<pause>',
          start_time=start_time,
          end_time=end_time,
          space_before=AnalysisToken(
            text=' ',
            start_time=word.start_time - 0.025,
            type=None,
          ),
          tokens=[
            AnalysisToken(
              text='<',
              start_time=start_time,
              type='spoken-incorrect',
            ),
            AnalysisToken(
              text=f'pause',
              start_time=None,
              type='spoken-incorrect',
            ),
            AnalysisToken(
              text='>',
              start_time=end_time,
              type='spoken-incorrect',
            ),
          ],
          errors=len(f'<pause>'),
        ))

        disfluents.append(Disfluent(
          start_time=start_time,
          end_time=end_time,
          text='pause'
        ))

    new_words.append(word)
    last_end_time = word.end_time

  return new_words

# def avg_volume(bytes: bytes) -> float:
#   sqSum = 0
#   samples = len(bytes) // 2

#   if samples == 0:
#     print("Bailing - no samples")
#     return 0

#   print([(((bytes[2 * i] + 256 * bytes[2 * i + 1] + 32768) % 65536) - 32768) / 32768 for i in range(20)])

#   for i in range(samples):
#     level = (((bytes[2 * i] + 256 * bytes[2 * i + 1] + 32768) % 65536) - 32768) / 32768
#     # level = ((bytes[2 * i] + 256 * bytes[2 * i + 1] + 32768) % 65536) / 32768
#     # level = -1 + (bytes[2 * i] + 256 * bytes[2 * i + 1]) / 32768
#     sqSum += level * level
  
#   print(f"Averged {samples} samples to produce sqSum: {sqSum}, volume: {sqSum / samples}")

#   return math.sqrt(sqSum / samples)
