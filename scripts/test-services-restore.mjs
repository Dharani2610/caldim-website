import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  let port = 3000;
  try {
    await page.goto('http://localhost:3000/#services', { waitUntil: 'networkidle', timeout: 5000 });
  } catch (e) {
    port = 3001;
    await page.goto('http://localhost:3001/#services', { waitUntil: 'networkidle', timeout: 5000 });
  }
  console.log(`Connected to port ${port}`);
  await page.waitForTimeout(3000);
  const el = await page.$('#services');
  if (el) {
    await el.screenshot({ path: 'scripts/services-restored.png' });
    console.log('Saved scripts/services-restored.png');
  }
  await browser.close();
}

main().catch(console.error);
