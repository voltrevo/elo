import * as stream from 'stream';
import * as child_process from 'child_process';
import readline from 'readline';

import type { AnalysisFragment } from './analyze';
import dirs from './dirs';

export default function pythonAnalyze(
  wavStream: stream.Readable,
  onFragment: (fragment: AnalysisFragment) => void,
  onError: (error: Error) => void,
) {
  const proc = child_process.spawn(
    `${dirs.pythonAnalyzer}/venv/bin/python`,
    [`${dirs.pythonAnalyzer}/cli.py`],
    { stdio: ['pipe', 'pipe', 'inherit'] },
  );

  wavStream.pipe(proc.stdin);

  const lines = readline.createInterface({
    input: proc.stdout,
    crlfDelay: Infinity,
  });

  (async () => {
    for await (const line of lines) {
      onFragment(JSON.parse(line));
    }
  })().catch(onError);
}
