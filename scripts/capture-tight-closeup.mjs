import { chromium } from 'playwright';
import path from 'path';

async function main() {
  const artDir = "C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\e30b9dc9-2d99-43b4-8473-320ae9b441d5";
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

  console.log('Navigating to http://localhost:3001...');
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

  await page.waitForSelector('#intro canvas', { timeout: 15000 });
  await page.waitForTimeout(10500);

  await page.evaluate(() => {
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';
    const textOverlay = document.querySelector('#intro > div.relative.z-10');
    if (textOverlay) textOverlay.style.display = 'none';
  });
  await page.waitForTimeout(500);

  // Close-up view of the left staircase area
  await page.screenshot({
    path: path.join(artDir, 'staircase-repositioned-closeup.png'),
    clip: { x: 670, y: 170, width: 480, height: 720 }
  });
  console.log('Saved staircase-repositioned-closeup.png');

  await browser.close();
}

main().catch(console.error);
