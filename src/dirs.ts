import path from 'path';

namespace dirs {
  export const projectRoot = path.join(__dirname, '..', '..', '..');
  export const build = path.join(projectRoot, 'build');
}

export default dirs;
