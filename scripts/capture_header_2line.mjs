import { chromium } from 'playwright';
import path from 'path';

const outDir = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\81792036-f14b-4fe2-824b-4f6c20cf6fba';

async function captureHeader() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const header = await page.$('header');
  if (header) {
    await header.screenshot({ path: path.join(outDir, 'header-2line-brand.png') });
  }

  // Also capture logo brand area close-up
  const brand = await page.$('nav a[href="#top"]');
  if (brand) {
    await brand.screenshot({ path: path.join(outDir, 'brand-logo-closeup.png') });
  }

  // Mobile check
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(300);
  const mobileBrand = await page.$('nav a[href="#top"]');
  if (mobileBrand) {
    await mobileBrand.screenshot({ path: path.join(outDir, 'brand-logo-mobile.png') });
  }

  await browser.close();
}

captureHeader().catch(console.error);
