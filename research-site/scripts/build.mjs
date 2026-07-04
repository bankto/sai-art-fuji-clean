import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteDir = path.resolve(scriptDir, '..');
const srcDir = path.join(siteDir, 'src');
const outDir = path.join(siteDir, 'dist');

async function main() {
  assertInside(siteDir, outDir);

  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });
  await fs.cp(srcDir, outDir, { recursive: true });
  console.log(`Output: ${path.relative(process.cwd(), outDir)}`);
  console.log('CSV data is fetched by the browser at page load.');
}

function assertInside(parent, target) {
  const relative = path.relative(path.resolve(parent), path.resolve(target));
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to write outside site directory: ${target}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
