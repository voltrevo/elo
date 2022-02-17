export type AnalysisFragment = (
  | { type: 'token', value: AnalysisToken }
  | { type: 'word', value: AnalysisWord }
  | { type: 'disfluent', value: AnalysisDisfluent }
  | { type: 'error', value: { message: string } }
  | { type: 'progress', value: AnalysisProgress }
  | { type: 'debug', value: { message: string } }
  | { type: 'end', value: { duration: number } }
);

export type Analysis = {
  tokens: AnalysisToken[],
  words: AnalysisWord[],
  duration: number,
  complete: boolean,
};

export type AnalysisWord = {
  start_time: number | null,
  end_time: number | null,
  disfluent: boolean,
  text: string,
};

export type AnalysisDisfluent = {
  start_time: number | null,
  end_time: number | null,
  category: string,
  text: string,
};

export type AnalysisProgress = {
  duration: number,
  audio_time: number,
  speaking_time: number,
  stream_processing_time: number,
  token_processing_time: number,
  other_processing_time: number,
};

export type AnalysisToken = {
  text: string | null,
  start_time: number | null,
};