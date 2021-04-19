import * as preact from 'preact';
import RecordButton from './RecordButton';

type State = Readonly<{
  recording: boolean,
}>;

const initialState: State = {
  recording: false,
};

export default class App extends preact.Component<{}, State> {
  state = initialState;

  render() {
    return <div class="recorder-app">
      <RecordButton
        active={this.state.recording}
        onClick={() => this.setState({ ...this.state, recording: !this.state.recording })}
      />
    </div>;
  }
}
