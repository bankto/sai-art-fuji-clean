import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteDir = path.resolve(scriptDir, '..');
const srcDir = path.join(siteDir, 'src');
const outDir = path.join(siteDir, 'dist');

async function main() {
  assertInside(siteDir, outDir);

  await fs.mkdir(outDir, { recursive: true });
  await writeIndex(path.join(srcDir, 'index.html'), path.join(outDir, 'index.html'));
  await fs.copyFile(path.join(srcDir, 'app.js'), path.join(outDir, 'app.js'));
  await fs.copyFile(path.join(srcDir, 'styles.css'), path.join(outDir, 'styles.css'));
  await fs.writeFile(path.join(outDir, '.nojekyll'), '');
  console.log(`Output: ${path.relative(process.cwd(), outDir)}`);
  console.log('Sheet data is fetched from the configured data API at page load.');
}

function assertInside(parent, target) {
  const relative = path.relative(path.resolve(parent), path.resolve(target));
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to write outside site directory: ${target}`);
  }
}

async function writeIndex(srcPath, outPath) {
  const apiUrl = process.env.RESEARCH_SITE_DATA_API_URL || '';
  const html = await fs.readFile(srcPath, 'utf8');
  await fs.writeFile(outPath, html.replaceAll('__RESEARCH_SITE_DATA_API_URL__', escapeHtmlAttribute(apiUrl)));
}

function escapeHtmlAttribute(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
