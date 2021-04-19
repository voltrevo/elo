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
      <div style={{ display: 'flex', flexDirection: 'row', padding: '2em' }}>
        <RecordButton
          active={this.state.recording}
          onClick={() => this.setState({ ...this.state, recording: !this.state.recording })}
        />
        <div style={{ marginLeft: '2em' }}>Text goes here</div>
      </div>
    </div>;
  }
}
