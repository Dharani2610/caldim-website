import { chromium } from 'playwright';
import path from 'path';

async function main() {
  const artDir = "C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\999af89a-ee76-483d-bd36-e97d5bd0eb27";
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--enable-gpu-rasterization', '--ignore-gpu-blocklist']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(10500);

  // Hide text overlays and header for pristine 3D view
  await page.evaluate(() => {
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';
    const textOverlay = document.querySelector('#intro > div.relative.z-10');
    if (textOverlay) textOverlay.style.display = 'none';
  });
  await page.waitForTimeout(400);

  const canvas = await page.locator('#intro canvas');
  // Crop directly around the East Tower staircase flights (upper right quadrant of model)
  await canvas.screenshot({
    path: path.join(artDir, 'stair-close-up-treads.png'),
    clip: { x: 750, y: 150, width: 550, height: 650 }
  });

  console.log('High-res stair close-up captured successfully!');
  await browser.close();
}

main().catch(console.error);
