import * as stream from 'stream';
import * as child_process from 'child_process';
import readline from 'readline';

import dirs from './dirs';
import { AnalysisFragment } from '../elo-types/Analysis';

export default function pythonAnalyze(
  wavStream: stream.Readable,
  onFragment: (fragment: AnalysisFragment) => void,
  onError: (error: Error) => void,
) {
  const lines = readline.createInterface({
    input: pythonAnalyzeRaw(wavStream, onError),
    crlfDelay: Infinity,
  });

  (async () => {
    for await (const line of lines) {
      onFragment(JSON.parse(line));
    }
  })().catch(onError);
}

export function pythonAnalyzeRaw(
  wavStream: stream.Readable,
  onError: (error: Error) => void,
): stream.Readable {
  const proc = child_process.spawn(
    `${dirs.pythonAnalyzer}/venv/bin/python`,
    [`${dirs.pythonAnalyzer}/cli.py`],
    { stdio: ['pipe', 'pipe', 'inherit'] },
  );

  proc.on('error', onError);

  proc.on('exit', code => {
    if (code !== 0) {
      onError(new Error(`Non-zero exit code from analyzer/cli.py (${code})`));
    }
  });

  wavStream.pipe(proc.stdin);

  return proc.stdout;
}
