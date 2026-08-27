const puppeteer = require('puppeteer');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log('=== Inspecting Live Site: https://theerasakoopp.github.io/Denchai-GIS/ ===\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--use-gl=swiftshader']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  
  const consoleErrors = [];
  const consoleWarns = [];
  const networkErrors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
    if (msg.type() === 'warning') consoleWarns.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));
  page.on('requestfailed', req => {
    networkErrors.push({ url: req.url(), error: req.failure()?.errorText });
  });

  console.log('1. Navigating...');
  await page.goto('https://theerasakoopp.github.io/Denchai-GIS/', { waitUntil: 'networkidle2', timeout: 45000 });
  await sleep(4000);

  // Inspect the page
  const pageInfo = await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.tab-btn')).map(b => b.textContent.trim());
    const activeTab = document.querySelector('.tab-btn.active')?.textContent?.trim();
    const categories = Array.from(document.querySelectorAll('.category-header')).map(h => h.textContent.trim());
    return { tabs, activeTab, categories };
  });
  console.log('2. Page Info:', JSON.stringify(pageInfo, null, 2));

  // Click on "📍 สถานที่สำคัญ" (POI tab)
  console.log('3. Clicking on POI Tab...');
  const tabButtons = await page.$$('.tab-btn');
  if (tabButtons.length > 0) {
    await tabButtons[0].click(); // First tab is POI
    await sleep(2000);
  }

  const afterPoiClick = await page.evaluate(() => {
    const activeTab = document.querySelector('.tab-btn.active')?.textContent?.trim();
    const items = Array.from(document.querySelectorAll('.category-item')).map(i => i.textContent.trim());
    return { activeTab, itemCount: items.length, sampleItems: items.slice(0, 5) };
  });
  console.log('4. After POI Click:', JSON.stringify(afterPoiClick, null, 2));

  console.log('\n5. Network Errors (failed requests):', networkErrors);
  console.log('\n6. Console Errors:', consoleErrors);
  console.log('\n7. Console Warnings:', consoleWarns);

  await browser.close();
})();
