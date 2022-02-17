import * as React from 'react';

type Props = {
  onDrop: (file: File) => void;
};

export default class DropDetector extends React.Component<Props> {
  render() {
    return <div
      className="drop-detector"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        zIndex: 1,
      }}
      onDrop={async (event) => {
        event.preventDefault();

        const target = event.target as HTMLElement;

        if (!target.classList.contains('drop-detector')) {
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

          this.props.onDrop(file);
          break; // TODO: Multiple files?
        }
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragEnter={(event) => {
        if (event.target instanceof HTMLElement && event.target.classList.contains('drop-detector')) {
          event.target.classList.add('drop-me');
        }
      }}
      onDragLeave={(event) => {
        if (event.target instanceof HTMLElement && event.target.classList.contains('drop-detector')) {
          event.target.classList.remove('drop-me');
        }
      }}
    ></div>;
  }
}
