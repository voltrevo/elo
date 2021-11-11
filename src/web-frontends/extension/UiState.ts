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

function UiState(): UiState {
  return {
    index: 0,

    active: false,
    loading: false,
  
    fillerSoundBox: {
      text: '',
      metric: '',
    },

    fillerWordBox: {
      text: '',
      metric: '',
    },
  };
}

export default UiState;
