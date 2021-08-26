export type AppMessage = (
  | { type: 'getUserMedia-called', value: null }
);

export type Callbacks = {
  onMessage: (msg: AppMessage) => void,
};

export default Callbacks;
