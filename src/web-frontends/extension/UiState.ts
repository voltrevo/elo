type UiState = {
  index: number;

  active: boolean;
  loading: boolean;
  word?: string;

  fillerSoundBox: WordBox;
  fillerWordBox: WordBox;
};

type WordBox = {
  text: string;
  metric: string;
};

export default UiState;
