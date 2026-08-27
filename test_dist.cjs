const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Simple static server for dist
const distDir = path.join(__dirname, 'dist');
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.geojson': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath.startsWith('/Denchai-GIS/')) {
    reqPath = reqPath.replace('/Denchai-GIS/', '/');
  }
  let filePath = path.join(distDir, reqPath === '/' ? 'index.html' : reqPath);
  
  if (!fs.existsSync(filePath)) {
    filePath = path.join(distDir, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Error loading file');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(4173, async () => {
  console.log('Static preview server listening on http://localhost:4173/Denchai-GIS/');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--use-gl=swiftshader']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const errors = [];
  const warns = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
    if (msg.type() === 'warning') warns.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  console.log('Navigating to http://localhost:4173/Denchai-GIS/ ...');
  await page.goto('http://localhost:4173/Denchai-GIS/', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4000));

  console.log('Console Errors:', errors);
  console.log('Console Warnings:', warns);

  await browser.close();
  server.close();
  console.log('Done test!');
});
