import * as preact from 'preact';

import { Settings } from './App';

type Props = {
  settings: Settings,
  onChange: (newSettings: Props['settings']) => void,
};

export default class SettingsPanel extends preact.Component<Props> {
  render() {
    const { maximumGap, cursorCorrection } = this.props.settings;

    let maximumGapStr = maximumGap?.toFixed(3) ?? '(None)';

    if (maximumGapStr !== '(None)') {
      maximumGapStr += 's';
    }

    const cursorCorrectionStr = (cursorCorrection >= 0 ? '+' : '') + cursorCorrection.toFixed(3);

    return <div class="panel">
      <div>Settings</div>
      <div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ textAlign: 'center' }}>Space Size: {maximumGapStr}</div>
          <div>
            <input
              type="range"
              value={Math.log(maximumGap ?? 1)}
              min="-5"
              max="0"
              step="0.01"
              onInput={e => {
                const domValue = (e.target as HTMLInputElement).value;
                const value = domValue === '0' ? null : Math.exp(Number(domValue));

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
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '2em' }}>
          <div>Token Display</div>
          <div>
            <input
              type="radio"
              checked={this.props.settings.tokenDisplay === 'both'}
              onInput={() => this.props.onChange({
                ...this.props.settings,
                tokenDisplay: 'both',
              })}
            /> Both
          </div>
          <div>
            <input
              type="radio"
              checked={this.props.settings.tokenDisplay === 'target'}
              onInput={() => this.props.onChange({
                ...this.props.settings,
                tokenDisplay: 'target',
              })}
            /> Target
          </div>
          <div>
            <input
              type="radio"
              checked={this.props.settings.tokenDisplay === 'spoken'}
              onInput={() => this.props.onChange({
                ...this.props.settings,
                tokenDisplay: 'spoken',
              })}
            /> Spoken
          </div>
        </div>
      </div>
    </div>;
  }
}
