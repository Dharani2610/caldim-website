import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function capture() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--enable-gpu-rasterization', '--ignore-gpu-blocklist']
  });
  const artDir = 'C:/Users/USER/.gemini/antigravity-ide/brain/999af89a-ee76-483d-bd36-e97d5bd0eb27';

  // Desktop
  const p1440 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p1440.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await p1440.waitForTimeout(6000);
  const intro1 = await p1440.locator('#intro');
  await intro1.screenshot({ path: path.join(artDir, 'hero-before-desktop-1440.png') });
  await intro1.screenshot({ path: 'scripts/hero-before-desktop-1440.png' });
  await p1440.close();

  // Mobile
  const p375 = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
  await p375.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await p375.waitForTimeout(6000);
  const intro2 = await p375.locator('#intro');
  await intro2.screenshot({ path: path.join(artDir, 'hero-before-mobile-375.png') });
  await intro2.screenshot({ path: 'scripts/hero-before-mobile-375.png' });
  await p375.close();

  await browser.close();
  console.log('Baseline before screenshots captured successfully!');
}

capture().catch(console.error);
