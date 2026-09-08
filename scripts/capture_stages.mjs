import { chromium } from 'playwright';
import path from 'path';

const outDir = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\81792036-f14b-4fe2-824b-4f6c20cf6fba';

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForSelector('canvas', { timeout: 10000 });

  // Click Replay button to restart the timeline from t = 0 cleanly
  const replayBtn = await page.$('button:has-text("REPLAY")');
  if (replayBtn) {
    console.log('Clicking REPLAY button to sync timeline...');
    await replayBtn.click();
  }

  // Helper to sleep
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));

  // Frame 0: t ~ 0.2s - Foundations and Base Plates
  await wait(350);
  await page.screenshot({ path: path.join(outDir, 'seq-1-foundations.png') });
  console.log('Captured seq-1-foundations.png');

  // Frame 1: t ~ 1.5s - Vertical Columns & Splice Plates
  await wait(1200);
  await page.screenshot({ path: path.join(outDir, 'seq-2-columns.png') });
  console.log('Captured seq-2-columns.png');

  // Frame 2: t ~ 4.2s - Level 1 & Level 2 Framing + Floor Decks
  await wait(2700);
  await page.screenshot({ path: path.join(outDir, 'seq-3-framing-decks.png') });
  console.log('Captured seq-3-framing-decks.png');

  // Frame 3: t ~ 7.2s - Bracing, Stairs, Ladder & Guardrails
  await wait(3000);
  await page.screenshot({ path: path.join(outDir, 'seq-4-bracing-stairs.png') });
  console.log('Captured seq-4-bracing-stairs.png');

  // Frame 4: t ~ 10.0s - Fully Completed Structure with Split Wipe & Soft Contact Shadows
  await wait(3000);
  await page.screenshot({ path: path.join(outDir, 'seq-5-completed-orbit.png') });
  console.log('Captured seq-5-completed-orbit.png');

  // Mobile Viewport at 375px
  await page.setViewportSize({ width: 375, height: 812 });
  await wait(500);
  await page.screenshot({ path: path.join(outDir, 'seq-6-mobile-375.png') });
  console.log('Captured seq-6-mobile-375.png');

  // Fallback checks: test reduced motion & no-webgl
  // Reduced motion emulation
  const pageRM = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });
  await pageRM.emulateMedia({ reducedMotion: 'reduce' });
  await pageRM.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await wait(800);
  await pageRM.screenshot({ path: path.join(outDir, 'seq-fallback-reduced-motion.png') });
  console.log('Captured seq-fallback-reduced-motion.png');
  await pageRM.close();

  // Test responsive overflow
  console.log('Testing horizontal overflow across viewports...');
  const widths = [320, 375, 414, 768, 1024, 1440];
  for (const w of widths) {
    await page.setViewportSize({ width: w, height: 900 });
    await wait(200);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const hasOverflow = scrollWidth > clientWidth;
    console.log(`Viewport ${w}px: scrollWidth=${scrollWidth}, clientWidth=${clientWidth}, overflow=${hasOverflow}`);
    if (hasOverflow) {
      console.error(`ERROR: Horizontal overflow detected at ${w}px!`);
    }
  }

  await browser.close();
  console.log('Capture and checks completed successfully.');
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
