import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/USER/.gemini/antigravity-ide/brain/724d998f-2514-42ba-93fa-b291461e3367';

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--enable-gpu-rasterization', '--ignore-gpu-blocklist']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#intro canvas', { timeout: 30000 });
  await page.waitForTimeout(11000);

  await page.evaluate(() => {
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';
    const textOverlay = document.querySelector('#intro > div.relative.z-10');
    if (textOverlay) textOverlay.style.display = 'none';
  });
  await page.waitForTimeout(500);

  const canvas = page.locator('#intro canvas');

  // Full building screenshot
  await canvas.screenshot({ path: path.join(ARTIFACT_DIR, 'staircase-full-isometric.png') });
  console.log('Saved staircase-full-isometric.png');

  // Tight Close-up of Level 1 Right Landing
  await canvas.screenshot({
    path: path.join(ARTIFACT_DIR, 'landing-right-closeup.png'),
    clip: { x: 740, y: 560, width: 380, height: 320 }
  });
  console.log('Saved landing-right-closeup.png');

  // Tight Close-up of Level 2 Left / Upper Landing
  await canvas.screenshot({
    path: path.join(ARTIFACT_DIR, 'landing-left-closeup.png'),
    clip: { x: 800, y: 320, width: 380, height: 320 }
  });
  console.log('Saved landing-left-closeup.png');

  // Also close-up of whole external stair spine
  await canvas.screenshot({
    path: path.join(ARTIFACT_DIR, 'staircase-spine-closeup.png'),
    clip: { x: 700, y: 280, width: 460, height: 600 }
  });
  console.log('Saved staircase-spine-closeup.png');

  await browser.close();
}

main().catch(console.error);
