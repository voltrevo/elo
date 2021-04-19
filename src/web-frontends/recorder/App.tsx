import * as preact from 'preact';
import RecordButton from './RecordButton';

export default class App extends preact.Component {
  render() {
    this;
    return <div class="recorder-app">
      <RecordButton active={false}></RecordButton>
    </div>;
  }
}
