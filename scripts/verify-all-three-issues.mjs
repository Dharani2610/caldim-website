import { chromium } from 'playwright';
import path from 'path';

async function main() {
  const artDir = "C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\999af89a-ee76-483d-bd36-e97d5bd0eb27";

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--enable-gpu-rasterization', '--ignore-gpu-blocklist']
  });

  console.log('=== 1. CAPTURING FULL DUAL-WING COMPLEX (1440px) ===');
  const page1440 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page1440.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  console.log('Waiting for complete assembly...');
  await page1440.waitForTimeout(10500);

  const desktopIntro = await page1440.locator('#intro');
  await desktopIntro.screenshot({ path: path.join(artDir, 'hero-after-dual-building-1440.png') });
  await desktopIntro.screenshot({ path: 'scripts/hero-after-dual-building-1440.png' });
  console.log('Saved full dual-building desktop screenshot.');

  // Clean fallback stills (hide DOM overlay before screenshot)
  await page1440.evaluate(() => {
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';
    const textOverlay = document.querySelector('#intro > div.relative.z-10');
    if (textOverlay) textOverlay.style.display = 'none';
  });
  await page1440.waitForTimeout(300);
  const canvas = await page1440.locator('#intro canvas');
  await canvas.screenshot({ path: 'public/images/hero-glow-frame-light.png' });

  const themeBtn = await page1440.locator('header button[aria-label*="theme"], button:has(.lucide-sun), button:has(.lucide-moon)').first();
  await page1440.evaluate(() => {
    const header = document.querySelector('header');
    if (header) header.style.display = '';
  });
  if (await themeBtn.count() > 0) {
    await themeBtn.click();
    await page1440.waitForTimeout(600);
    await page1440.evaluate(() => {
      const header = document.querySelector('header');
      if (header) header.style.display = 'none';
    });
    await canvas.screenshot({ path: 'public/images/hero-glow-frame.png' });
  }
  await page1440.close();

  console.log('\n=== 2. CAPTURING MOBILE VIEW (375px) ===');
  const page375 = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
  await page375.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page375.waitForTimeout(10500);
  const mobileIntro = await page375.locator('#intro');
  await mobileIntro.screenshot({ path: path.join(artDir, 'hero-after-dual-building-375.png') });
  await mobileIntro.screenshot({ path: 'scripts/hero-after-dual-building-375.png' });
  console.log('Saved mobile screenshot.');
  await page375.close();

  console.log('\n=== 3. CAPTURING CLOSE-UP STAIRCASE TREAD SPACING ===');
  const stairPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await stairPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await stairPage.waitForTimeout(10500);
  // Zoom in / capture the stair run specifically
  const stairShot = await stairPage.locator('#intro canvas');
  await stairShot.screenshot({
    path: path.join(artDir, 'stair-close-up-treads.png'),
    clip: { x: 920, y: 160, width: 480, height: 680 }
  });
  console.log('Saved stair close-up screenshot.');
  await stairPage.close();

  console.log('\n=== 4. CAPTURING 5-FRAME INCREMENTAL CONSTRUCTION SEQUENCE ===');
  const animTimes = [
    { t: 1500, label: 'stage-1-foundations-level1-columns' },
    { t: 3000, label: 'stage-2-level2-columns-flight1' },
    { t: 4500, label: 'stage-3-level3-columns-flight2' },
    { t: 6000, label: 'stage-4-level4-columns-flight3' },
    { t: 8000, label: 'stage-5-roof-terrace-crown' }
  ];

  for (const { t, label } of animTimes) {
    const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await p.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(t);
    await p.locator('#intro').screenshot({ path: path.join(artDir, `anim-${label}.png`) });
    console.log(`Captured animation progression frame: anim-${label}.png (${t}ms)`);
    await p.close();
  }

  await browser.close();
  console.log('\nAll visual verification captures completed successfully!');
}

main().catch(console.error);
