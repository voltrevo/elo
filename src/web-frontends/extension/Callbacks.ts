export type AppMessage = (
  | { type: 'getUserMedia-called', value: null }
  | { type: 'disfluent', value: string }
);

export type Callbacks = {
  onMessage: (msg: AppMessage) => void,
};

export default Callbacks;
