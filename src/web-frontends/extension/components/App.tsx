import * as preact from 'preact';

export default class App extends preact.Component<{}, {}> {
  render(): preact.ComponentChild {
    this;

    return <div class="app">
      <div class="head">Fluency Extension</div>
      <div class="body">
        <div class="word">
          Test
        </div>
      </div>
    </div>;
  }
}
