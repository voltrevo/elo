import { AnalysisWord } from '../../analyze';

export type AppMessage = (
  | { type: 'getUserMedia-called', value: null }
  | { type: 'word', value: AnalysisWord }
);

export type Callbacks = {
  onMessage: (msg: AppMessage) => void,
};

export default Callbacks;
