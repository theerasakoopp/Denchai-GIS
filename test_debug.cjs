const puppeteer = require('puppeteer');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log('=== Inspecting MapLibre Layers, Sources & Features ===\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--use-gl=swiftshader']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  
  const consoleErrors = [];
  const consoleWarns = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
    if (msg.type() === 'warning') consoleWarns.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  console.log('1. Navigating to http://localhost:5173/ ...');
  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 30000 });
  } catch (e) {
    console.log('   Error navigating:', e.message);
  }
  
  await sleep(4000);

  // Inspect the window and React components
  const debugInfo = await page.evaluate(() => {
    // Check if MapLibre canvas exists
    const canvas = document.querySelector('.maplibregl-canvas');
    const container = document.querySelector('.map-container');
    const wrap = document.querySelector('.map-wrap');

    return {
      canvas: !!canvas,
      container: !!container,
      wrap: !!wrap,
      title: document.title,
    };
  });
  console.log('2. DOM Structure:', JSON.stringify(debugInfo, null, 2));

  // Inspect MapLibre map instance if we expose it or find it
  const mapState = await page.evaluate(() => {
    // Find all layers and sources
    // Let's check window or canvas
    return {
      activeTab: document.querySelector('.tab-btn.active')?.textContent?.trim(),
      allTabs: Array.from(document.querySelectorAll('.tab-btn')).map(b => b.textContent.trim()),
      basemapBtns: Array.from(document.querySelectorAll('.basemap-btn')).map(b => b.textContent.trim()),
      activeBasemap: document.querySelector('.basemap-btn.active')?.textContent?.trim()
    };
  });
  console.log('3. UI State:', JSON.stringify(mapState, null, 2));

  // Console output
  console.log('\n4. Console Errors:', consoleErrors);
  console.log('\n5. Console Warnings:', consoleWarns);

  await browser.close();
})();
