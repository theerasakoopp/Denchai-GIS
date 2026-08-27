const puppeteer = require('puppeteer');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log('=== Denchai GIS Basemap Button Test ===\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  
  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  console.log('1. Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 30000 });
  console.log('   Page loaded.');

  // Wait for map to render
  await sleep(5000);

  // Check if basemap buttons exist
  console.log('\n2. Checking basemap buttons...');
  const buttons = await page.$$('.basemap-btn');
  console.log(`   Found ${buttons.length} .basemap-btn elements`);

  // Get text content of each button
  const btnTexts = await page.$$eval('.basemap-btn', els => els.map(el => ({
    text: el.textContent.trim(),
    className: el.className,
    visible: window.getComputedStyle(el).display !== 'none',
    pointerEvents: window.getComputedStyle(el).pointerEvents,
    rect: el.getBoundingClientRect().toJSON()
  })));

  for (const btn of btnTexts) {
    console.log(`   Button: "${btn.text}" | visible=${btn.visible} | pointer-events=${btn.pointerEvents}`);
    console.log(`     rect: x=${btn.rect.x.toFixed(0)} y=${btn.rect.y.toFixed(0)} w=${btn.rect.width.toFixed(0)} h=${btn.rect.height.toFixed(0)}`);
  }

  // Check z-index stacking
  const controlInfo = await page.evaluate(() => {
    const control = document.querySelector('.basemap-control');
    const canvas = document.querySelector('.maplibregl-canvas');
    if (!control || !canvas) return { error: 'Missing elements', control: !!control, canvas: !!canvas };
    const cStyle = window.getComputedStyle(control);
    return {
      control_zIndex: cStyle.zIndex,
      control_position: cStyle.position,
      control_pointerEvents: cStyle.pointerEvents,
    };
  });
  console.log('\n3. Z-Index & pointer-events:');
  console.log('   ', JSON.stringify(controlInfo));

  // Hit-test at button center
  const hitTestResult = await page.evaluate(() => {
    const firstBtn = document.querySelector('.basemap-btn');
    if (!firstBtn) return { error: 'No button found' };
    const rect = firstBtn.getBoundingClientRect();
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    const el = document.elementFromPoint(cx, cy);
    if (!el) return { x: cx, y: cy, element: null };
    return {
      x: Math.round(cx), y: Math.round(cy),
      tagName: el.tagName,
      className: el.className,
      isButton: el.closest('.basemap-btn') !== null,
      text: el.textContent?.substring(0, 30)
    };
  });
  console.log('\n4. Hit-test at first button center:');
  console.log('   ', JSON.stringify(hitTestResult));

  // Check all children of .map-wrap for z-index conflicts
  const mapOverlays = await page.evaluate(() => {
    const mapWrap = document.querySelector('.map-wrap');
    if (!mapWrap) return [{ error: 'no .map-wrap' }];
    const children = Array.from(mapWrap.children);
    return children.map(c => ({
      tag: c.tagName,
      class: c.className.substring(0, 60),
      zIndex: window.getComputedStyle(c).zIndex,
      position: window.getComputedStyle(c).position,
      pointerEvents: window.getComputedStyle(c).pointerEvents,
    }));
  });
  console.log('\n5. Children of .map-wrap:');
  for (const o of mapOverlays) {
    console.log(`   <${o.tag}> class="${o.class}" z=${o.zIndex} pos=${o.position} pe=${o.pointerEvents}`);
  }

  // ── Click Tests ──────────────────────────────────────────
  console.log('\n6. Testing button clicks...');
  
  const initialActive = await page.$eval('.basemap-btn.active', el => el.textContent.trim()).catch(() => 'NONE');
  console.log(`   Initial active: "${initialActive}"`);

  // Click ดาวเทียม
  const satBtn = await page.evaluateHandle(() => {
    return [...document.querySelectorAll('.basemap-btn')].find(b => b.textContent.includes('ดาวเทียม'));
  });
  if (satBtn.asElement()) {
    console.log('\n   >>> Clicking "ดาวเทียม"...');
    await satBtn.asElement().click();
    await sleep(2000);
    const after = await page.$eval('.basemap-btn.active', el => el.textContent.trim()).catch(() => 'NONE');
    console.log(`   Active after click: "${after}"`);
    console.log(`   Changed? ${after !== initialActive ? 'YES ✅' : 'NO ❌'}`);
  }

  // Click มืด (GIS)
  const darkBtn = await page.evaluateHandle(() => {
    return [...document.querySelectorAll('.basemap-btn')].find(b => b.textContent.includes('มืด'));
  });
  if (darkBtn.asElement()) {
    console.log('\n   >>> Clicking "มืด (GIS)"...');
    await darkBtn.asElement().click();
    await sleep(2000);
    const after = await page.$eval('.basemap-btn.active', el => el.textContent.trim()).catch(() => 'NONE');
    console.log(`   Active after click: "${after}"`);
    console.log(`   Changed to dark? ${after.includes('มืด') ? 'YES ✅' : 'NO ❌'}`);
  }

  // Click OSM
  const osmBtn = await page.evaluateHandle(() => {
    return [...document.querySelectorAll('.basemap-btn')].find(b => b.textContent.trim() === 'OSM');
  });
  if (osmBtn.asElement()) {
    console.log('\n   >>> Clicking "OSM"...');
    await osmBtn.asElement().click();
    await sleep(2000);
    const after = await page.$eval('.basemap-btn.active', el => el.textContent.trim()).catch(() => 'NONE');
    console.log(`   Active after click: "${after}"`);
    console.log(`   Changed to OSM? ${after.includes('OSM') ? 'YES ✅' : 'NO ❌'}`);
  }

  // Click UAV
  const uavBtn = await page.evaluateHandle(() => {
    return [...document.querySelectorAll('.basemap-btn')].find(b => b.textContent.includes('UAV'));
  });
  if (uavBtn.asElement()) {
    console.log('\n   >>> Clicking "โดรน UAV"...');
    await uavBtn.asElement().click();
    await sleep(2000);
    const after = await page.$eval('.basemap-btn.active', el => el.textContent.trim()).catch(() => 'NONE');
    console.log(`   Active after click: "${after}"`);
    console.log(`   Changed to UAV? ${after.includes('UAV') ? 'YES ✅' : 'NO ❌'}`);
  }

  // Console errors
  console.log('\n7. Console errors:');
  if (consoleErrors.length === 0) {
    console.log('   None! ✅');
  } else {
    for (const e of consoleErrors.slice(0, 10)) {
      console.log(`   ❌ ${e.substring(0, 200)}`);
    }
  }

  console.log('\n=== Test Complete ===');
  
  await browser.close();
})();
