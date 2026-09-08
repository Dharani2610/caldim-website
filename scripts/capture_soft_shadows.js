const { chromium } = require('playwright');
const path = require('path');

async function main() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true
  });

  const artifactDir = "C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\8201c3e0-271d-4a8d-a691-5087ba358e67";

  console.log('--- 1. Capturing Desktop 1440x900 ---');
  const page1440 = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });
  await page1440.goto('http://localhost:3002/', { waitUntil: 'load' });
  await page1440.evaluate(() => localStorage.setItem('caldim-theme', 'dark'));
  await page1440.reload();
  console.log('Waiting 18s for full assembly and slow orbit with soft shadow...');
  await page1440.waitForTimeout(18000);
  const path1440 = path.join(artifactDir, 'hero-3d-clean-shadow-1440.png');
  await page1440.screenshot({ path: path1440 });
  console.log(`Saved: ${path1440}`);

  console.log('\n--- 2. Capturing Mobile 375x812 ---');
  const page375 = await browser.newPage({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2
  });
  await page375.goto('http://localhost:3002/', { waitUntil: 'load' });
  await page375.waitForTimeout(18000);
  const path375 = path.join(artifactDir, 'hero-3d-clean-shadow-375.png');
  await page375.screenshot({ path: path375 });
  console.log(`Saved: ${path375}`);

  console.log('\n--- 3. Checking Horizontal Overflow ---');
  for (const w of [320, 375, 414, 768, 1024, 1440]) {
    const p = await browser.newPage({ viewport: { width: w, height: 800 } });
    await p.goto('http://localhost:3002/', { waitUntil: 'load' });
    await p.waitForTimeout(2000);
    const overflow = await p.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
    }));
    console.log(`Viewport ${w}px:`, overflow);
    await p.close();
  }

  console.log('\n--- 4. Checking Fallbacks ---');
  // Reduced motion
  const rmPage = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await rmPage.goto('http://localhost:3002/', { waitUntil: 'load' });
  await rmPage.waitForTimeout(1500);
  const rmCanvas = await rmPage.$('canvas');
  const rmImg = await rmPage.$('#intro img');
  console.log(`prefers-reduced-motion: Canvas=${!!rmCanvas}, FallbackImg=${!!rmImg}`);
  await rmPage.screenshot({ path: path.join(artifactDir, 'hero-clean-reduced-motion.png') });
  await rmPage.close();

  // WebGL disabled
  const noGlContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const noGlPage = await noGlContext.newPage();
  await noGlPage.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await noGlPage.goto('http://localhost:3002/', { waitUntil: 'load' });
  await noGlPage.waitForTimeout(1500);
  const noGlCanvas = await noGlPage.$('canvas');
  const noGlImg = await noGlPage.$('#intro img');
  console.log(`WebGL disabled: Canvas=${!!noGlCanvas}, FallbackImg=${!!noGlImg}`);
  await noGlPage.screenshot({ path: path.join(artifactDir, 'hero-clean-nowebgl.png') });
  await noGlPage.close();
  await noGlContext.close();

  await page1440.close();
  await page375.close();
  await browser.close();
  console.log('\nAll checks completed successfully!');
}

main().catch(console.error);
