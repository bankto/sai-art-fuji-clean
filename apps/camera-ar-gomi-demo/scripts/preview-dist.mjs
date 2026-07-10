import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const port = Number(process.env.PORT ?? 4173);
const host = process.env.HOST ?? '127.0.0.1';
const types = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
]);

createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);
  const requestedFile = normalize(join(root, pathname === '/' ? 'index.html' : pathname));
  const safeRoot = normalize(root);
  const file = requestedFile.startsWith(safeRoot) && existsSync(requestedFile) && statSync(requestedFile).isFile()
    ? requestedFile
    : join(root, 'index.html');

  response.writeHead(200, {
    'content-type': types.get(extname(file)) ?? 'application/octet-stream',
  });
  createReadStream(file).pipe(response);
}).listen(port, host, () => {
  console.log(`preview http://${host}:${port}`);
});
