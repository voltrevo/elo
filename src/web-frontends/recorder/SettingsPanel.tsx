import * as preact from 'preact';

import { Settings } from './App';

type Props = {
  settings: Settings,
  onChange: (newSettings: Props['settings']) => void,
};

export default class SettingsPanel extends preact.Component<Props> {
  render() {
    const { maximumGap, cursorCorrection } = this.props.settings;

    const maximumGapStr = maximumGap.toFixed(3);
    const cursorCorrectionStr = (cursorCorrection >= 0 ? '+' : '') + cursorCorrection.toFixed(3);

    return <div class="panel">
      <div>Settings</div>
      <div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ textAlign: 'center' }}>Space Size: {maximumGapStr}s</div>
          <div>
            <input
              type="range"
              value={Math.log(maximumGap)}
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
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '2em' }}>
          <div style={{ textAlign: 'center' }}>Cursor Correction: {cursorCorrectionStr}s</div>
          <div>
            <input
              type="range"
              value={cursorCorrection}
              min="-0.5"
              max="0.5"
              step="0.01"
              onInput={e => {
                const value = Number((e.target as HTMLInputElement).value);

                this.props.onChange({
                  ...this.props.settings,
                  cursorCorrection: value,
                });
              }}
            />
          </div>
        </div>
        <div style={{ marginLeft: '2em' }}>
          Monospace:
          <input
            type="checkbox"
            checked={this.props.settings.monospace}
            onInput={e => {
              const value = (e.target as HTMLInputElement).checked;

              this.props.onChange({
                ...this.props.settings,
                monospace: value,
              });
            }}
          />
        </div>
      </div>
    </div>;
  }
}
