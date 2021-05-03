from typing import List, Optional
from .types import Analysis, AnalysisToken, TargetAnalysis

pause_threshold = 0.8

def augment_disfluents(analysis: Analysis) -> Analysis:
  if analysis.target is None:
    return analysis
  
  last_start_time: Optional[float] = None
  last_was_space = False

  new_tokens: List[AnalysisToken] = []

  for token in analysis.target.tokens:
    new_tokens.append(token)
    print(token)

    if token.start_time is None:
      continue
    
    if token.text == ' ':
      last_was_space = True
    else:
      if (
        last_was_space and
        last_start_time is not None and
        token.start_time - last_start_time > pause_threshold
      ):
        curr_token = new_tokens.pop()

        new_tokens[-1] = AnalysisToken(
          text=' ',
          start_time=last_start_time + 0.025,
          type=new_tokens[-1].type,
        )

        new_tokens.append(AnalysisToken(
          text='<',
          start_time=last_start_time + 0.05,
          type='spoken-incorrect',
        ))

        new_tokens.append(AnalysisToken(
          text='pause',
          start_time=None,
          type='spoken-incorrect',
        ))

        new_tokens.append(AnalysisToken(
          text='>',
          start_time=token.start_time - 0.05,
          type='spoken-incorrect',
        ))

        new_tokens.append(AnalysisToken(
          text=' ',
          start_time=token.start_time - 0.025,
          type='spoken-incorrect',
        ))

        new_tokens.append(curr_token)

      last_start_time = token.start_time

  return Analysis(
    deepspeech=analysis.deepspeech,
    target=TargetAnalysis(
      target_transcript=analysis.target.target_transcript,
      speech_transcript=analysis.target.speech_transcript,
      tokens=new_tokens,
    ),
    duration=analysis.duration,
  )
