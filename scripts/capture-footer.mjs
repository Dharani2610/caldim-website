import { chromium } from 'playwright';

async function captureFooter() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  
  await page.evaluate(() => {
    const el = document.getElementById('site-footer');
    if (el) {
      el.scrollIntoView();
    }
  });
  await page.waitForTimeout(1000);
  
  const footer = await page.$('#site-footer');
  if (footer) {
    await footer.screenshot({ path: 'scripts/footer-captured.png' });
    console.log('Saved footer screenshot successfully to scripts/footer-captured.png');
  } else {
    console.log('Could not find #site-footer element');
  }
  await browser.close();
}

captureFooter().catch(console.error);
