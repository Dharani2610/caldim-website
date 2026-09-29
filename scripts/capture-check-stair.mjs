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

  // Hide text overlays and header for pure 3D structural view
  await page.evaluate(() => {
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';
    const textOverlay = document.querySelector('#intro > div.relative.z-10');
    if (textOverlay) textOverlay.style.display = 'none';
  });

  // Wait for 3D construction animation to fully complete
  await page.waitForTimeout(11500);

  const canvas = await page.locator('#intro canvas');

  // 1. Wide View
  await canvas.screenshot({
    path: path.join(artDir, 'check-stair-wide.png')
  });

  // 2. Zoom Level 1 Landing & Treads
  await canvas.screenshot({
    path: path.join(artDir, 'check-stair-level1-zoom.png'),
    clip: { x: 800, y: 400, width: 450, height: 450 }
  });

  // 3. Zoom Level 2 & 3 Landing & Flight Transition
  await canvas.screenshot({
    path: path.join(artDir, 'check-stair-midlevels-zoom.png'),
    clip: { x: 750, y: 180, width: 500, height: 500 }
  });

  console.log('Saved check screenshots.');
  await browser.close();
}

main().catch(console.error);
