type Label = {
  type: 'reference' | 'generated',
  time: number;
  data?: unknown;
};

export default Label;
