import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, isAbsolute, join, normalize, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = normalize(join(dirname(fileURLToPath(import.meta.url)), '..', 'dist'));
const port = Number(process.env.PORT ?? 4173);
const host = process.env.HOST ?? '127.0.0.1';
const pagesBase = '/sai-art-fuji-clean/local-map-gps-demo';
const types = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.png', 'image/png'],
]);

createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host}`);
  let pathname = decodeURIComponent(url.pathname);

  if (pathname === pagesBase) {
    pathname = '/';
  } else if (pathname.startsWith(`${pagesBase}/`)) {
    pathname = pathname.slice(pagesBase.length);
  }

  const requestedFile = normalize(join(root, pathname === '/' ? 'index.html' : pathname));
  const relativePath = relative(root, requestedFile);
  const safelyInsideRoot = !relativePath.startsWith('..') && !isAbsolute(relativePath);
  const file =
    safelyInsideRoot && existsSync(requestedFile) && statSync(requestedFile).isFile()
      ? requestedFile
      : join(root, 'index.html');

  response.writeHead(200, {
    'content-type': types.get(extname(file)) ?? 'application/octet-stream',
  });
  createReadStream(file).pipe(response);
}).listen(port, host, () => {
  console.log(`preview http://${host}:${port}${pagesBase}/`);
});
