import * as React from 'react';

type Props = Readonly<{
  active: boolean,
  onClick?: () => void,
  onFile: (file: File) => void,
}>;

export default class RecordButton extends React.Component<Props> {
  render() {
    return <div
      className={`record-btn${this.props.active ? ' active' : ''}`}
      style={{ position: 'relative' }} onClick={this.props.onClick}
      onDrop={async (event) => {
        event.preventDefault();

        const target = event.target as HTMLElement;

        if (!target.classList.contains('record-btn')) {
          return;
        }

        target.classList.remove('drop-me');

        const dropFiles = event.dataTransfer?.files;

        if (dropFiles === undefined) {
          return;
        }

        for (let i = 0; i < dropFiles.length; i++) {
          const file = dropFiles.item(i);

          if (file === null) {
            continue;
          }

          this.props.onFile(file);
          break; // TODO: Multiple files?
        }
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragEnter={(event) => {
        if (event.target instanceof HTMLElement && event.target.classList.contains('record-btn')) {
          event.target.classList.add('drop-me');
        }
      }}
      onDragLeave={(event) => {
        if (event.target instanceof HTMLElement && event.target.classList.contains('record-btn')) {
          event.target.classList.remove('drop-me');
        }
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        className="record-btn-outer"
      >
        <div className="record-btn-inner"></div>
      </div>
    </div>;
  }
}
