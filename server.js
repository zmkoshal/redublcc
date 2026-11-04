const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5173;
const DIST_DIR = path.join(__dirname, 'frontend', 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

const server = http.createServer((req, res) => {
  // Normalize URL and strip query strings / hashes
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(reqUrl.pathname);

  // If deployed under /redublcc/ path, strip prefix
  if (pathname.startsWith('/redublcc/')) {
    pathname = pathname.slice('/redublcc'.length);
  } else if (pathname === '/redublcc') {
    pathname = '/';
  }

  // Handle API proxy to Flask backend if running locally
  if (pathname.startsWith('/api/')) {
    const proxyReq = http.request(
      {
        host: '127.0.0.1',
        port: 5000,
        path: req.url,
        method: req.method,
        headers: req.headers
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );
    proxyReq.on('error', () => {
      // If Flask is not running, let frontend mock handle it
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Backend API offline, falling back to client mode' }));
    });
    req.pipe(proxyReq);
    return;
  }

  // Static file serving from frontend/dist
  let filePath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);

  // Security: prevent path traversal outside DIST_DIR
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end('Access Denied');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA client-side routing
      filePath = path.join(DIST_DIR, 'index.html');
    }

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 - Internal Server Error');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000'
      });
      res.end(content);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('========================================================');
  console.log('  RED Publicis Credit Card & Expense Management System  ');
  console.log('========================================================');
  console.log(`  Local Server:  http://localhost:${PORT}`);
  console.log(`  LAN Network:   http://127.0.0.1:${PORT}`);
  console.log('  Live Cloud:    https://zmkoshal.github.io/redublcc/');
  console.log('========================================================');
  console.log('  Press Ctrl + C to stop the server.');
});
