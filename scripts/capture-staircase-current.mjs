import { chromium } from 'playwright';
import path from 'path';

async function main() {
  const artDir = "C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\fa3be403-bf0f-444a-bc1d-579557b8bbe0";
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

  console.log('Navigating to http://localhost:3001...');
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

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
  await page.waitForTimeout(400);

  const canvas = await page.locator('#intro canvas');

  // 1. Full view
  await canvas.screenshot({
    path: path.join(artDir, 'staircase-current-full.png')
  });
  console.log('Saved staircase-current-full.png');

  // 2. Close-up view of the staircase area
  await canvas.screenshot({
    path: path.join(artDir, 'staircase-current-closeup.png'),
    clip: { x: 750, y: 150, width: 550, height: 650 }
  });
  console.log('Saved staircase-current-closeup.png');

  await browser.close();
}

main().catch(console.error);
