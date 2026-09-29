import { chromium } from 'playwright';

async function captureDarkMode() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Toggle or set dark mode if applicable
  await page.evaluate(() => {
    document.documentElement.classList.remove('light');
    const el = document.getElementById('site-footer');
    if (el) el.scrollIntoView();
  });
  await page.waitForTimeout(500);

  const footer = await page.$('#site-footer');
  if (footer) {
    await footer.screenshot({ path: 'scripts/footer-dark-captured.png' });
    console.log('Saved dark mode footer screenshot');
  }
  await browser.close();
}

captureDarkMode().catch(console.error);
