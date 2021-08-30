import { AnalysisDisfluent, AnalysisWord } from '../../analyze';

export type AppMessage = (
  | { type: 'getUserMedia-called', value: null }
  | { type: 'word', value: AnalysisWord }
  | { type: 'disfluent', value: AnalysisDisfluent }
  | { type: 'connecting', value: null }
  | { type: 'reconnecting', value: null }
  | { type: 'connected', value: null }
);

export type Callbacks = {
  onMessage: (msg: AppMessage) => void,
};

export default Callbacks;
