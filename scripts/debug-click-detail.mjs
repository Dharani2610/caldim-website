import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.getElementById('services')?.scrollIntoView({ behavior: 'instant', block: 'start' }));
  await page.waitForTimeout(500);

  // Click Learn more
  await page.click('#service-front-estimation button');
  await page.waitForTimeout(600);

  // Try clicking back button and print exact error
  try {
    await page.click('#service-back-estimation button', { timeout: 3000 });
    console.log('Clicked back button successfully!');
  } catch (err) {
    console.log('Detailed Click Error:\n', err.message);
  }

  await browser.close();
})().catch(console.error);
