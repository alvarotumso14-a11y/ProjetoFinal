import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = process.env.FRONTEND_ROOT || path.dirname(fileURLToPath(import.meta.url));
const testApi = process.env.FRONTEND_TEST_API;
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.json':'application/json; charset=utf-8'};
http.createServer(async (req,res) => {
  try {
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if (pathname.split('/').some(part => part.startsWith('.'))) { res.writeHead(404).end(); return; }
    const target = path.resolve(root, '.'+(pathname==='/'?'/index.html':pathname));
    const relative = path.relative(root,target);
    if (relative.startsWith('..') || path.isAbsolute(relative)) { res.writeHead(403).end(); return; }
    let body = await fs.readFile(target);
    if (testApi && path.extname(target)==='.html') {
      body = Buffer.from(body.toString().replace('<head>',`<head><script>window.GLICHELP_API_URL=${JSON.stringify(testApi)};</script>`));
    }
    res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(req.method==='HEAD'?undefined:body);
  } catch { res.writeHead(404).end('Arquivo nao encontrado.'); }
}).listen(5173,'localhost',() => console.log('Frontend: http://localhost:5173'));
