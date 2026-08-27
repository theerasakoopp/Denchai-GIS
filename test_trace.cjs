const puppeteer = require('puppeteer');

(async () => {
  console.log('=== Checking for JavaScript & MapLibre Runtime Errors ===\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--use-gl=angle',
      '--use-angle=swiftshader'
    ]
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
  });
  
  page.on('pageerror', err => {
    console.error('[PAGE ERROR STACK]:', err.stack || err.message);
  });
  
  page.on('requestfailed', req => {
    console.warn('[FAILED NETWORK REQUEST]:', req.url(), req.failure()?.errorText);
  });

  console.log('Navigating to https://theerasakoopp.github.io/Denchai-GIS/ ...');
  await page.goto('https://theerasakoopp.github.io/Denchai-GIS/', { waitUntil: 'networkidle2', timeout: 30000 });

  await new Promise(r => setTimeout(r, 4000));

  // Let's inspect window.location, document title, root element children
  const domStatus = await page.evaluate(() => {
    const root = document.getElementById('root');
    const map = document.querySelector('.maplibregl-canvas');
    const sidebar = document.querySelector('.sidebar');
    const loading = document.body.innerText.includes('กำลังโหลด');
    return {
      rootChildren: root ? root.children.length : 0,
      hasCanvas: !!map,
      hasSidebar: !!sidebar,
      isLoading: loading,
      bodyTextSnippet: document.body.innerText.slice(0, 300)
    };
  });

  console.log('\nDOM Status:', JSON.stringify(domStatus, null, 2));

  await browser.close();
})();
