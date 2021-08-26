import * as preact from 'preact';

export default class App extends preact.Component<{}, {}> {
  render(): preact.ComponentChild {
    return <div class="app">Hello world</div>;
  }
}
