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

  // 1. Capture 6-Frame Progressive Staircase Assembly Sequence
  console.log('Capturing assembly sequence...');
  const sequenceTimings = [
    { name: 'stair-compact-seq-1-ground-pad.png', wait: 2000 },
    { name: 'stair-compact-seq-2-flight-0-deck-1.png', wait: 1600 },
    { name: 'stair-compact-seq-3-flight-1-deck-2.png', wait: 1400 },
    { name: 'stair-compact-seq-4-flight-2-deck-3.png', wait: 1400 },
    { name: 'stair-compact-seq-5-flight-3-deck-4.png', wait: 1400 },
    { name: 'stair-compact-seq-6-fully-assembled.png', wait: 3500 },
  ];

  for (const step of sequenceTimings) {
    await page.waitForTimeout(step.wait);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, step.name) });
    console.log(`Captured ${step.name}`);
  }

  // 2. Full Isometric Reference View
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'stair-compact-isometric-full.png') });

  // 3. Zoom into Staircase Area (Switchback spine)
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'stair-compact-spine-crop.png'),
    clip: { x: 800, y: 150, width: 450, height: 720 }
  });

  // 4. Landing 1 Close-up (Right Landing at Deck 1, Y=2.40)
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'stair-compact-landing-right-deck1.png'),
    clip: { x: 920, y: 550, width: 320, height: 280 }
  });

  // 5. Landing 2 Close-up (Left Landing at Deck 2, Y=4.80)
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'stair-compact-landing-left-deck2.png'),
    clip: { x: 860, y: 360, width: 340, height: 300 }
  });

  // 6. Front Elevation / Direct View of Staircase
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'stair-compact-front-elevation-crop.png'),
    clip: { x: 820, y: 160, width: 440, height: 710 }
  });

  // 7. Check for horizontal overflow
  const hasOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  console.log(`Horizontal overflow check: ${hasOverflow ? 'FAILED' : 'PASSED'}`);

  await browser.close();
  console.log('Verification completed successfully.');
}

main().catch(console.error);
