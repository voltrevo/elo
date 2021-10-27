import type { AnalysisFragment } from './analyze';
import readLines from './helpers/readLines';

export default async function analyzeViaFetch(
  url: string,
  f: File,
  onFragment: (fragment: AnalysisFragment) => void,
) {
  const resp = await fetch(url, { method: 'POST', body: f });

  if (resp.status >= 400) {
    throw new Error(`Unexpected status ${resp.status}`);
  }

  if (resp.body === null) {
    return;
  }

  await readLines(
    resp.body,
    line => onFragment(JSON.parse(line) as AnalysisFragment),
  );
}
