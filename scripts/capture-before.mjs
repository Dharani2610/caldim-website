import { chromium } from 'playwright';

async function capture() {
  const browser = await chromium.launch({ headless: true });

  // 1440px
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(11000);

    const el = await page.$('#intro');
    if (el) {
      await el.screenshot({ path: 'scripts/hero-3d-before-1440.png' });
    }
    await context.close();
  }

  // 375px
  {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await context.newPage();
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(11000);

    const el = await page.$('#intro');
    if (el) {
      await el.screenshot({ path: 'scripts/hero-3d-before-375.png' });
    }
    await context.close();
  }

  await browser.close();
  console.log('Done capturing before screenshots.');
}

capture().catch(console.error);
