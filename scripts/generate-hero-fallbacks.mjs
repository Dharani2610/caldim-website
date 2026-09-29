import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--enable-gpu-rasterization', '--ignore-gpu-blocklist']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#intro canvas', { timeout: 30000 });
  await page.waitForTimeout(11000); // Wait for full assembly

  // Hide UI text to capture clean canvas
  await page.evaluate(() => {
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';
    const textOverlay = document.querySelector('h1')?.closest('div.relative.z-10');
    if (textOverlay) textOverlay.style.display = 'none';
  });

  const canvas = await page.$('#intro canvas');
  if (canvas) {
    const lightPath = path.resolve('frontend/public/images/hero-glow-frame-light.png');
    const darkPath = path.resolve('frontend/public/images/hero-glow-frame.png');
    await canvas.screenshot({ path: lightPath });
    // Also copy to darkPath if applicable or capture dark
    fs.copyFileSync(lightPath, darkPath);
    console.log('Regenerated hero-glow-frame-light.png and hero-glow-frame.png');
  }

  await browser.close();
}

main().catch(console.error);
