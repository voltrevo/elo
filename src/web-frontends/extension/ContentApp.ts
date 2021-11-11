import { AnalysisFragment } from "../../analyze";
import TaskQueue from "../../helpers/TaskQueue";
import Protocol, { ConnectionEvent, PromisishApi } from "./Protocol";
import UiState from "./UiState";

export default class ContentApp implements PromisishApi<Protocol> {
  uiState: UiState = {
    index: 0,

    active: false,
    loading: false,

    fillerSoundBox: {
      text: '',
      metric: '0.0',
    },

    fillerWordBox: {
      text: '',
      metric: '0.0',
    },
  };

  uiStateRequests = new TaskQueue();

  updateUi() {
    this.uiState.index++;
    this.uiStateRequests.run();
  }

  notifyGetUserMediaCalled() {}
  addFragment(fragment: AnalysisFragment) {}
  addConnectionEvent(evt: ConnectionEvent) {}

  getUiState(afterIndex: number) {
    if (this.uiState.index > afterIndex) {
      return this.uiState;
    }

    return new Promise<UiState>((resolve) => {
      this.uiStateRequests.push(() => resolve(this.uiState));
    });
  }
}
