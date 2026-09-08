import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function main() {
  const artifactDir = "C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\81792036-f14b-4fe2-824b-4f6c20cf6fba";

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist']
  });

  // 1. Desktop 1440px
  console.log('--- 1. Capturing Desktop 1440px Fully Assembled ---');
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1
    });
    const page = await context.newPage();
    await page.goto('http://localhost:3000/', { waitUntil: 'load' });
    console.log('Waiting 14s for complete assembly and split reveal...');
    await page.waitForTimeout(14000);

    const destPath = path.join(artifactDir, 'hero-3d-after-1440.png');
    const intro = await page.$('#intro');
    if (intro) {
      await intro.screenshot({ path: destPath });
    } else {
      await page.screenshot({ path: destPath });
    }
    console.log(`Saved: ${destPath}`);
    await context.close();
  }

  // 2. Mobile 375px
  console.log('\n--- 2. Capturing Mobile 375px Fully Assembled ---');
  {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      deviceScaleFactor: 2
    });
    const page = await context.newPage();
    await page.goto('http://localhost:3000/', { waitUntil: 'load' });
    console.log('Waiting 14s for complete assembly on mobile...');
    await page.waitForTimeout(14000);

    const destPath = path.join(artifactDir, 'hero-3d-after-375.png');
    const intro = await page.$('#intro');
    if (intro) {
      await intro.screenshot({ path: destPath });
    } else {
      await page.screenshot({ path: destPath });
    }
    console.log(`Saved: ${destPath}`);
    await context.close();
  }

  // 3. Overflow test
  console.log('\n--- 3. Testing Horizontal Overflow ---');
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

  // 4. Reduced motion & No WebGL fallbacks
  console.log('\n--- 4. Testing Fallbacks ---');
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('http://localhost:3000/', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const hasCanvas = await page.$('#intro canvas');
    const hasImg = await page.$('#intro img');
    console.log(`Reduced motion: Canvas present: ${!!hasCanvas}, Fallback Image present: ${!!hasImg}`);
    await page.screenshot({ path: path.join(artifactDir, 'fallback-reduced-motion.png') });
    await context.close();
  }

  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.addInitScript(() => {
      HTMLCanvasElement.prototype.getContext = () => null;
    });
    await page.goto('http://localhost:3000/', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const hasCanvas = await page.$('#intro canvas');
    const hasImg = await page.$('#intro img');
    console.log(`WebGL disabled: Canvas present: ${!!hasCanvas}, Fallback Image present: ${!!hasImg}`);
    await page.screenshot({ path: path.join(artifactDir, 'fallback-nowebgl.png') });
    await context.close();
  }

  // Copy before images to artifact directory
  if (fs.existsSync('scripts/hero-3d-before-1440.png')) {
    fs.copyFileSync('scripts/hero-3d-before-1440.png', path.join(artifactDir, 'hero-3d-before-1440.png'));
  }
  if (fs.existsSync('scripts/hero-3d-before-375.png')) {
    fs.copyFileSync('scripts/hero-3d-before-375.png', path.join(artifactDir, 'hero-3d-before-375.png'));
  }

  await browser.close();
  console.log('\nAll steps completed successfully!');
}

main().catch(console.error);
