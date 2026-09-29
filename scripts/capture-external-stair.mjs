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

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Wait for canvas to be mounted
  await page.waitForSelector('#intro canvas', { timeout: 15000 });
  console.log('Canvas mounted! Waiting 10.5s for 3D construction animation to finish...');
  await page.waitForTimeout(10500);

  // Hide text overlays and header for pure 3D structural view
  await page.evaluate(() => {
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';
    const textOverlay = document.querySelector('#intro > div.relative.z-10');
    if (textOverlay) textOverlay.style.display = 'none';
  });
  await page.waitForTimeout(500);

  const canvas = await page.locator('#intro canvas');

  // 1. Full view
  await canvas.screenshot({
    path: path.join(artDir, 'staircase-external-full.png')
  });
  console.log('Saved staircase-external-full.png');

  // 2. Close-up view of the staircase area
  await canvas.screenshot({
    path: path.join(artDir, 'staircase-external-closeup.png'),
    clip: { x: 750, y: 150, width: 550, height: 650 }
  });
  console.log('Saved staircase-external-closeup.png');

  await browser.close();
}

main().catch(console.error);
