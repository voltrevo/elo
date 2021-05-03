import * as stream from 'stream';
import * as child_process from 'child_process';

import type { Analysis } from "./analyze";
import dirs from './dirs';

export default async function pythonAnalyze(
  bytes: Buffer,
  targetTranscript: string | null,
): Promise<Analysis> {
  const args = [`${dirs.pythonAnalyzer}/cli.py`];

  if (targetTranscript !== null) {
    args.push('--target_transcript', targetTranscript);
  }

  const proc = child_process.spawn(`${dirs.pythonAnalyzer}/venv/bin/python`, args);

  stream.Readable.from(bytes).pipe(proc.stdin);

  const stdout = await streamToString(proc.stdout);

  try {
    // TODO: Type checking
    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(await streamToString(proc.stderr));
  }
}

function streamToString(stream: stream.Stream): Promise<string> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  })
}
