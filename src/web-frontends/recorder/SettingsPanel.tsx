import * as preact from 'preact';

import { Settings } from './App';

type Props = {
  settings: Settings,
  onChange: (newSettings: Props['settings']) => void,
};

export default class SettingsPanel extends preact.Component<Props> {
  render() {
    const maximumGapStr = this.props.settings.maximumGap.toFixed(3);

    return <div class="panel">
      <div>Settings</div>
      <div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ textAlign: 'center' }}>Space Size: {maximumGapStr}s</div>
          <div>
            <input
              type="range"
              value={Math.log(this.props.settings.maximumGap)}
              min="-5"
              max="0"
              step="0.01"
              onInput={e => {
                const value = Math.exp(Number((e.target as HTMLInputElement).value));

                this.props.onChange({
                  ...this.props.settings,
                  maximumGap: value,
                });
              }}
            />
          </div>
        </div>
      </div>
    </div>;
  }
}
