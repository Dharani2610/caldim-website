import { chromium } from 'playwright';
import path from 'path';

async function main() {
  const artDir = "C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\8aaf8c42-8a67-4752-8950-eb47e2c6378e";
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-gl=angle',
      '--use-angle=d3d11',
      '--enable-webgl',
      '--enable-webgl2',
      '--enable-gpu-rasterization',
      '--ignore-gpu-blocklist',
      '--disable-gpu-sandbox'
    ]
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForSelector('#intro canvas', { timeout: 15000 });

  await page.evaluate(() => {
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';
    const textOverlay = document.querySelector('#intro > div.relative.z-10');
    if (textOverlay) textOverlay.style.display = 'none';
  });

  await page.waitForTimeout(11500);

  const canvas = await page.locator('#intro canvas');

  // Exact close crop of the stairs and landings
  await page.screenshot({
    path: path.join(artDir, 'stair-precise-closeup.png'),
    clip: { x: 900, y: 150, width: 450, height: 700 }
  });

  // Single landing transition zoom (Level 2 & 3 landing transition)
  await page.screenshot({
    path: path.join(artDir, 'landing-transition-zoom.png'),
    clip: { x: 950, y: 280, width: 380, height: 420 }
  });

  console.log('Saved precise closeup screenshots.');
  await browser.close();
}

main().catch(console.error);
