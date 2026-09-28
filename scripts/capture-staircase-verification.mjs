import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/USER/.gemini/antigravity-ide/brain/724d998f-2514-42ba-93fa-b291461e3367';

async function main() {
  console.log('Launching browser with GPU & WebGL support...');
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

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  console.log('Waiting for #intro selector...');
  await page.waitForSelector('#intro', { timeout: 30000 });

  console.log('Waiting for canvas...');
  await page.waitForSelector('#intro canvas', { timeout: 30000 });

  console.log('Canvas detected! Waiting for initial assembly...');
  await page.waitForTimeout(11000);

  // Hide text overlay and header for crisp 3D inspection
  await page.evaluate(() => {
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';
    const textOverlay = document.querySelector('#intro > div.relative.z-10');
    if (textOverlay) textOverlay.style.display = 'none';
  });
  await page.waitForTimeout(500);

  const canvas = page.locator('#intro canvas');

  // 1. Full building view at assembled state
  await canvas.screenshot({ path: path.join(ARTIFACT_DIR, 'staircase-full-isometric.png') });
  console.log('Captured staircase-full-isometric.png');

  // 2. Close-up screenshot of Level 1 Right Landing (Turn 1: Lane A -> Landing -> Lane B)
  await canvas.screenshot({
    path: path.join(ARTIFACT_DIR, 'landing-right-closeup.png'),
    clip: { x: 420, y: 320, width: 480, height: 420 }
  });
  console.log('Captured landing-right-closeup.png (Level 1 Right Landing)');

  // 3. Close-up screenshot of Level 2 Left Landing (Turn 2: Lane B -> Landing -> Lane A)
  await canvas.screenshot({
    path: path.join(ARTIFACT_DIR, 'landing-left-closeup.png'),
    clip: { x: 300, y: 160, width: 500, height: 440 }
  });
  console.log('Captured landing-left-closeup.png (Level 2 Left Landing)');

  // 4. Update Fallback Stills (hero-glow-frame-light.png and hero-glow-frame.png)
  await canvas.screenshot({ path: 'frontend/public/images/hero-glow-frame-light.png' });
  try {
    await canvas.screenshot({ path: 'public/images/hero-glow-frame-light.png' });
  } catch (_) {}
  console.log('Updated hero-glow-frame-light.png');

  // Switch to Dark theme
  await page.evaluate(() => {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  });
  await page.waitForTimeout(800);
  await canvas.screenshot({ path: 'frontend/public/images/hero-glow-frame.png' });
  try {
    await canvas.screenshot({ path: 'public/images/hero-glow-frame.png' });
  } catch (_) {}
  console.log('Updated hero-glow-frame.png');

  // Replay animation sequence capture
  console.log('Triggering REPLAY to capture progressive erection frames...');
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    const textOverlay = document.querySelector('#intro > div.relative.z-10');
    if (textOverlay) textOverlay.style.display = 'block';
  });
  await page.waitForTimeout(300);

  const replayBtn = page.locator('button:has-text("REPLAY"), button:has-text("Replay"), button[aria-label*="replay" i]').first();
  if (await replayBtn.isVisible()) {
    await replayBtn.click();
    await page.evaluate(() => {
      const textOverlay = document.querySelector('#intro > div.relative.z-10');
      if (textOverlay) textOverlay.style.display = 'none';
    });

    // Sequence Frame 1: Foundations & Lower Structure settling (t ≈ 1.6s)
    await page.waitForTimeout(1600);
    await canvas.screenshot({ path: path.join(ARTIFACT_DIR, 'seq-frame-1-ground-pad.png') });
    console.log('Captured seq-frame-1-ground-pad.png');

    // Sequence Frame 2: Flight 0 Stringers & Treads rising in Lane A (t ≈ 2.8s)
    await page.waitForTimeout(1200);
    await canvas.screenshot({ path: path.join(ARTIFACT_DIR, 'seq-frame-2-flight-0-lane-a.png') });
    console.log('Captured seq-frame-2-flight-0-lane-a.png');

    // Sequence Frame 3: Level 1 Right Landing & Flight 1 in Lane B (t ≈ 4.1s)
    await page.waitForTimeout(1300);
    await canvas.screenshot({ path: path.join(ARTIFACT_DIR, 'seq-frame-3-flight-1-lane-b.png') });
    console.log('Captured seq-frame-3-flight-1-lane-b.png');

    // Sequence Frame 4: Level 2 Left Landing & Flight 2 in Lane A (t ≈ 5.5s)
    await page.waitForTimeout(1400);
    await canvas.screenshot({ path: path.join(ARTIFACT_DIR, 'seq-frame-4-flight-2-lane-a.png') });
    console.log('Captured seq-frame-4-flight-2-lane-a.png');

    // Sequence Frame 5: Flight 3 in Lane B & Level 4 Landing (t ≈ 6.9s)
    await page.waitForTimeout(1400);
    await canvas.screenshot({ path: path.join(ARTIFACT_DIR, 'seq-frame-5-flight-3-lane-b.png') });
    console.log('Captured seq-frame-5-flight-3-lane-b.png');

    // Sequence Frame 6: Completed Switchback Staircase (t ≈ 8.8s)
    await page.waitForTimeout(1900);
    await canvas.screenshot({ path: path.join(ARTIFACT_DIR, 'seq-frame-6-fully-assembled.png') });
    console.log('Captured seq-frame-6-fully-assembled.png');
  }

  // 5. Test reduced motion fallback
  const reducedContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce'
  });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await reducedPage.waitForTimeout(1000);
  await reducedPage.screenshot({ path: path.join(ARTIFACT_DIR, 'reduced-motion-fallback.png') });
  console.log('Captured reduced-motion-fallback.png');

  console.log('Errors logged:', errors);
  await browser.close();
  console.log('Verification completed successfully!');
}

main().catch(console.error);
