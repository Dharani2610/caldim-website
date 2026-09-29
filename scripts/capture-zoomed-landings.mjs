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
  await page.waitForTimeout(11000); // fully assembled

  await page.evaluate(() => {
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';
    const textOverlay = document.querySelector('#intro > div.relative.z-10');
    if (textOverlay) textOverlay.style.display = 'none';
  });
  await page.waitForTimeout(500);

  const canvas = page.locator('#intro canvas');

  // 1. Right Landing Close-up (Level 1 Turn: Lane A -> Landing Plate -> Lane B)
  await canvas.screenshot({
    path: path.join(ARTIFACT_DIR, 'landing-right-turn-closeup.png'),
    clip: { x: 520, y: 500, width: 340, height: 350 }
  });
  console.log('Saved landing-right-turn-closeup.png');

  // 2. Left Landing Close-up (Level 2 Turn: Lane B -> Landing Plate -> Lane A)
  await canvas.screenshot({
    path: path.join(ARTIFACT_DIR, 'landing-left-turn-closeup.png'),
    clip: { x: 420, y: 310, width: 350, height: 340 }
  });
  console.log('Saved landing-left-turn-closeup.png');

  // 3. Staircase Full Elevation Close-up
  await canvas.screenshot({
    path: path.join(ARTIFACT_DIR, 'staircase-full-switchback-crop.png'),
    clip: { x: 380, y: 150, width: 520, height: 740 }
  });
  console.log('Saved staircase-full-switchback-crop.png');

  await browser.close();
}

main().catch(console.error);
