/* Research is stored outside the public repository and its Pages assets. */
const fs = require('node:fs');
const path = require('node:path');

module.exports = function privateResearchDirectory() {
  const configured = process.env.LONDON_PRIVATE_RESEARCH_DIR;
  if (!configured || !path.isAbsolute(configured)) {
    throw new Error('Set LONDON_PRIVATE_RESEARCH_DIR to an existing absolute directory outside the repository.');
  }
  const directory = fs.realpathSync(configured);
  const root = fs.realpathSync(path.join(__dirname, '..'));
  const relative = path.relative(root, directory);
  if (!relative || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative))) {
    throw new Error('Private research must be outside the public repository.');
  }
  if (!fs.statSync(directory).isDirectory()) throw new Error('Private research path must be a directory.');
  return directory;
};
