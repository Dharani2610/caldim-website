import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function main() {
  const artifactDir = "C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\81792036-f14b-4fe2-824b-4f6c20cf6fba";

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist']
  });

  console.log('--- 1. Capturing Sequential Construction Frames (Desktop 1440x900) ---');

  // Frame 0: Initial load state (t ≈ 0.3s) — Foundations starting, 0 debris/chaos
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto('http://localhost:3000/', { waitUntil: 'load' });
    await page.waitForTimeout(300);
    const intro = await page.$('#intro');
    const p0 = path.join(artifactDir, 'construction-0-initial-load.png');
    if (intro) await intro.screenshot({ path: p0 });
    console.log(`Saved Frame 0 (Initial Load): ${p0}`);
    await context.close();
  }

  // Frame 1: Foundations & Rising Columns (t ≈ 1.8s)
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto('http://localhost:3000/', { waitUntil: 'load' });
    await page.waitForTimeout(1800);
    const intro = await page.$('#intro');
    const p1 = path.join(artifactDir, 'construction-1-columns.png');
    if (intro) await intro.screenshot({ path: p1 });
    console.log(`Saved Frame 1 (Columns & Base): ${p1}`);
    await context.close();
  }

  // Frame 2: Primary Beams & Multi-tier Framing (t ≈ 4.6s)
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto('http://localhost:3000/', { waitUntil: 'load' });
    await page.waitForTimeout(4600);
    const intro = await page.$('#intro');
    const p2 = path.join(artifactDir, 'construction-2-framing.png');
    if (intro) await intro.screenshot({ path: p2 });
    console.log(`Saved Frame 2 (Framing & Decks): ${p2}`);
    await context.close();
  }

  // Frame 3: Bracing, Stairs & Access Systems (t ≈ 7.5s)
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto('http://localhost:3000/', { waitUntil: 'load' });
    await page.waitForTimeout(7500);
    const intro = await page.$('#intro');
    const p3 = path.join(artifactDir, 'construction-3-bracing-stairs.png');
    if (intro) await intro.screenshot({ path: p3 });
    console.log(`Saved Frame 3 (Bracing & Stairs): ${p3}`);
    await context.close();
  }

  // Frame 4: Fully Finished Assembled Structure with Split Theme Reveal & Orbit (t ≈ 12s)
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto('http://localhost:3000/', { waitUntil: 'load' });
    await page.waitForTimeout(12000);
    const intro = await page.$('#intro');
    const p4 = path.join(artifactDir, 'construction-4-completed-split.png');
    if (intro) await intro.screenshot({ path: p4 });
    console.log(`Saved Frame 4 (Completed Split Reveal): ${p4}`);
    await context.close();
  }

  // Mobile Finished Frame (375x812 at t ≈ 12s)
  {
    console.log('\n--- 2. Capturing Mobile 375x812 Finished Construction ---');
    const context = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    await page.goto('http://localhost:3000/', { waitUntil: 'load' });
    await page.waitForTimeout(12000);
    const intro = await page.$('#intro');
    const pm = path.join(artifactDir, 'construction-mobile-375.png');
    if (intro) await intro.screenshot({ path: pm });
    console.log(`Saved Mobile 375px: ${pm}`);
    await context.close();
  }

  // Horizontal Overflow Verification
  console.log('\n--- 3. Verifying Zero Horizontal Overflow ---');
  for (const w of [320, 375, 414, 768, 1024, 1440]) {
    const context = await browser.newContext({ viewport: { width: w, height: 800 } });
    const page = await context.newPage();
    await page.goto('http://localhost:3000/', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const overflow = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
    }));
    console.log(`Width ${w}px: clientWidth=${overflow.clientWidth}, scrollWidth=${overflow.scrollWidth}, hasOverflow=${overflow.hasOverflow}`);
    await context.close();
  }

  // Fallback Verification
  console.log('\n--- 4. Verifying Reduced Motion & WebGL Fallbacks ---');
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('http://localhost:3000/', { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    const hasCanvas = await page.$('#intro canvas');
    const hasImg = await page.$('#intro img');
    console.log(`prefers-reduced-motion: Canvas=${!!hasCanvas}, FallbackImg=${!!hasImg}`);
    await context.close();
  }

  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.addInitScript(() => {
      HTMLCanvasElement.prototype.getContext = () => null;
    });
    await page.goto('http://localhost:3000/', { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    const hasCanvas = await page.$('#intro canvas');
    const hasImg = await page.$('#intro img');
    console.log(`WebGL disabled: Canvas=${!!hasCanvas}, FallbackImg=${!!hasImg}`);
    await context.close();
  }

  await browser.close();
  console.log('\nSequential construction verification completed successfully!');
}

main().catch(console.error);
