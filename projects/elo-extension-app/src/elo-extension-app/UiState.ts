type UiState = {
  index: number;

  active: boolean;
  notifyMissingAccount: boolean;
  notifyUpgrade: boolean;
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
    notifyMissingAccount: false,
    notifyUpgrade: false,
    loading: false,

    fillerSoundBox: {
      text: 'ums & uhs',
      count: 0,
      metric: '0',
    },

    fillerWordBox: {
      text: 'filler words',
      count: 0,
      metric: '0',
    },
  };
}

export default UiState;
