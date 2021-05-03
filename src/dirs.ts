import path from 'path';

function getEnv(varName: string): string {
  const value = process.env[varName];

  if (typeof value !== 'string') {
    throw new Error(`Required: ${varName} environment variable`);
  }

  return value;
}

namespace dirs {
  export const projectRoot = path.join(__dirname, '..', '..', '..');
  export const build = path.join(projectRoot, 'build');
  export const data = path.join(getEnv('HOME'), 'data', 'deepspeech-exp');
  export const pythonAnalyzer = path.join(projectRoot, 'analyzer');
}

export default dirs;
