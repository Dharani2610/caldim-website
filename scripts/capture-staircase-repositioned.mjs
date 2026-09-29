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

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  console.log('Navigating to http://localhost:3001...');
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

  await page.waitForSelector('#intro canvas', { timeout: 15000 });
  console.log('Canvas mounted! Waiting 10.5s for 3D construction animation...');
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
    path: path.join(artDir, 'staircase-repositioned-full.png')
  });
  console.log('Saved staircase-repositioned-full.png');

  // 2. Close-up view of the left staircase area
  await canvas.screenshot({
    path: path.join(artDir, 'staircase-repositioned-closeup.png'),
    clip: { x: 350, y: 180, width: 550, height: 650 }
  });
  console.log('Saved staircase-repositioned-closeup.png');

  // 3. Test REPLAY functionality
  console.log('Testing REPLAY button...');
  await page.evaluate(() => {
    const textOverlay = document.querySelector('#intro > div.relative.z-10');
    if (textOverlay) textOverlay.style.display = 'block';
  });
  await page.waitForTimeout(300);

  // Find and click Replay button
  const replayBtn = await page.locator('button:has-text("REPLAY"), button:has-text("Replay"), button[aria-label*="replay" i]').first();
  if (await replayBtn.isVisible()) {
    console.log('Clicking replay button...');
    await replayBtn.click();
    await page.waitForTimeout(2500); // 2.5s into replay

    await page.evaluate(() => {
      const textOverlay = document.querySelector('#intro > div.relative.z-10');
      if (textOverlay) textOverlay.style.display = 'none';
    });
    await page.waitForTimeout(300);

    await canvas.screenshot({
      path: path.join(artDir, 'staircase-replaying-animation.png')
    });
    console.log('Saved staircase-replaying-animation.png (construction animation in progress)');
  }

  console.log('Errors encountered:', errors);
  await browser.close();
}

main().catch(console.error);
