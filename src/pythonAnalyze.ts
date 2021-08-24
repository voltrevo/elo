import * as http from 'http';
import * as stream from 'stream';
import * as child_process from 'child_process';

import type { Analysis } from './analyze';
import dirs from './dirs';

const runServer = (() => {
  let proc: child_process.ChildProcess | null = null;

  return () => {
    if (proc !== null) {
      return;
    }

    proc = child_process.spawn(
      `${dirs.pythonAnalyzer}/venv/bin/python`,
      [`${dirs.pythonAnalyzer}/server.py`],
      { stdio: 'inherit' },
    );

    proc.on('error', (error) => {
      console.error(error);
    });

    proc.on('exit', () => {
      proc = null;
    });
  };
})();

runServer();

export default async function pythonAnalyze(
  wavStream: stream.Readable,
  targetTranscript: string | null,
): Promise<Analysis> {
  runServer();

  const { req, res } = await new Promise<{ req: http.ClientRequest, res: http.IncomingMessage }>((resolve) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 28329,
        path: '/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(targetTranscript === null ? {} : {
            'x-target-transcript': targetTranscript,
          }),
        },
      },
      (res) => {
        resolve({ req, res });
      },
    );

    wavStream.pipe(req);

    req.on('error', error => {
      console.error(error);
    });
  });

  const responseString = await streamToString(res);

  try {
    // TODO: Type checking
    return JSON.parse(responseString);
  } catch (error) {
    throw new Error(`Failed to parse: ${responseString}`);
  }
}

export async function pythonAnalyzeCLI(
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

  const stdoutStart = stdout.indexOf('{');

  if (stdoutStart !== 0) {
    console.log(stdout.slice(0, stdoutStart));
  }

  try {
    // TODO: Type checking
    return JSON.parse(stdout.slice(stdoutStart));
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
  });
}
