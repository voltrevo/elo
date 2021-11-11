import * as preact from 'preact';
import SessionStats from '../storage/SessionStats';

import Storage from '../storage/Storage';

const storage = new Storage('elo');

type State = {
  data: unknown;
};

export default class Dashboard extends preact.Component<{}, State> {
  async componentWillMount() {
    const root = await storage.readRoot();

    if (root.lastSessionKey === undefined) {
      this.setState({ data: 'no last session' });
      return;
    }

    const lastSession = await storage.read<SessionStats>(root.lastSessionKey);
    this.setState({ data: lastSession ?? 'error' });
  }

  render() {
    return <div class="elo-page">
      <pre>
        {JSON.stringify(this.state.data, null, 2)}
      </pre>
    </div>;
  }
}
