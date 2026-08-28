const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to live site...');
  await page.goto('https://theerasakoopp.github.io/Denchai-GIS/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  console.log('Testing click on Infrastructure Tab...');
  const tabBtns = await page.$$('.tab-btn');
  console.log('Found tab buttons:', tabBtns.length);
  for (let i = 0; i < tabBtns.length; i++) {
    const text = await page.evaluate(el => el.textContent, tabBtns[i]);
    console.log('Tab', i, text);
    if (text.includes('โครงสร้าง')) {
      console.log('Clicking tab:', text);
      await tabBtns[i].click();
      break;
    }
  }

  await new Promise(r => setTimeout(r, 1000));

  // Expand the first category accordion if needed
  console.log('Looking for category headers...');
  const catHeaders = await page.$$('.category-header');
  console.log('Found category headers:', catHeaders.length);
  if (catHeaders.length > 0) {
    console.log('Clicking first category header to expand...');
    await catHeaders[0].click();
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('Looking for edit buttons...');
  const editBtns = await page.$$('button[title*="Edit"], button[title*="แก้ไข"], .btn-icon-subtle');
  console.log('Found edit buttons:', editBtns.length);
  if (editBtns.length > 0) {
    console.log('Clicking first edit button...');
    await editBtns[0].click();
    await new Promise(r => setTimeout(r, 1000));

    const modal = await page.$('.modal-card');
    console.log('Modal visible:', !!modal);
    if (modal) {
      const modalText = await page.evaluate(el => el.innerText, modal);
      console.log('Modal text preview:\n', modalText);

      // Try clicking reshape button
      const reshapeBtn = await page.$('button:has-text("ดัดจุด"), button:has-text("Reshape")');
      const allBtns = await page.$$('.modal-card button');
      for (const btn of allBtns) {
        const t = await page.evaluate(el => el.innerText, btn);
        if (t.includes('ดัดจุด') || t.includes('Reshape')) {
          console.log('Clicking reshape button:', t);
          await btn.click();
          await new Promise(r => setTimeout(r, 1000));
          break;
        }
      }
    }
  }

  // Check top banner
  const banner = await page.evaluate(() => {
    const el = document.querySelector('div[style*="zIndex: 5500"], div[style*="z-index: 5500"]');
    return el ? el.innerText : null;
  });
  console.log('Top banner text:', banner);

  await browser.close();
})();
