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
  count: number;
  metric: string;
};

function UiState(): UiState {
  return {
    index: 0,

    active: false,
    loading: false,
  
    fillerSoundBox: {
      text: '',
      count: 0,
      metric: '',
    },

    fillerWordBox: {
      text: '',
      count: 0,
      metric: '',
    },
  };
}

export default UiState;
