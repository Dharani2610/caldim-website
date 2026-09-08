import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function main() {
  const artifactDir = "C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\81792036-f14b-4fe2-824b-4f6c20cf6fba";
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist']
  });

  console.log('--- 1. Capturing Desktop (1440x900) ---');
  const page1440 = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });
  await page1440.goto('http://localhost:3000/', { waitUntil: 'load' });
  // Wait for assembly to complete and settle into smooth orbit
  console.log('Waiting 6s for intro assembly sequence to finish...');
  await page1440.waitForTimeout(6000);
  
  const desktopIntro = await page1440.$('#intro');
  const path1440 = path.join(artifactDir, 'hero-after-desktop-1440.png');
  if (desktopIntro) {
    await desktopIntro.screenshot({ path: path1440 });
  } else {
    await page1440.screenshot({ path: path1440 });
  }
  console.log(`Saved desktop screenshot: ${path1440}`);

  console.log('\n--- 2. Capturing Mobile (375x812) ---');
  const page375 = await browser.newPage({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2
  });
  await page375.goto('http://localhost:3000/', { waitUntil: 'load' });
  await page375.waitForTimeout(6000);
  
  const mobileIntro = await page375.$('#intro');
  const path375 = path.join(artifactDir, 'hero-after-mobile-375.png');
  if (mobileIntro) {
    await mobileIntro.screenshot({ path: path375 });
  } else {
    await page375.screenshot({ path: path375 });
  }
  console.log(`Saved mobile screenshot: ${path375}`);

  console.log('\n--- 3. Checking Horizontal Overflow ---');
  const viewports = [320, 375, 414, 768, 1024, 1440];
  const overflowResults = [];
  for (const w of viewports) {
    const p = await browser.newPage({ viewport: { width: w, height: 800 } });
    await p.goto('http://localhost:3000/', { waitUntil: 'load' });
    await p.waitForTimeout(2000);
    const overflow = await p.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
    }));
    console.log(`Viewport ${w}px:`, overflow);
    overflowResults.push({ width: w, ...overflow });
    await p.close();
  }

  console.log('\n--- 4. Checking Fallbacks ---');
  // Reduced motion
  const rmContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const rmPage = await rmContext.newPage();
  await rmPage.goto('http://localhost:3000/', { waitUntil: 'load' });
  await rmPage.waitForTimeout(1500);
  const rmCanvas = await rmPage.$('#intro canvas');
  const rmImg = await rmPage.$('#intro img');
  console.log(`prefers-reduced-motion: Canvas=${!!rmCanvas}, FallbackImg=${!!rmImg}`);
  await rmPage.screenshot({ path: path.join(artifactDir, 'hero-reduced-motion-fallback.png') });
  await rmPage.close();
  await rmContext.close();

  // WebGL disabled
  const noGlContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const noGlPage = await noGlContext.newPage();
  await noGlPage.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await noGlPage.goto('http://localhost:3000/', { waitUntil: 'load' });
  await noGlPage.waitForTimeout(1500);
  const noGlCanvas = await noGlPage.$('#intro canvas');
  const noGlImg = await noGlPage.$('#intro img');
  console.log(`WebGL disabled: Canvas=${!!noGlCanvas}, FallbackImg=${!!noGlImg}`);
  await noGlPage.screenshot({ path: path.join(artifactDir, 'hero-nowebgl-fallback.png') });
  await noGlPage.close();
  await noGlContext.close();

  // Copy baseline before screenshots to artifactDir for presentation if they exist
  if (fs.existsSync('scripts/hero-3d-before-1440.png')) {
    fs.copyFileSync('scripts/hero-3d-before-1440.png', path.join(artifactDir, 'hero-before-desktop-1440.png'));
    console.log('Copied baseline desktop before screenshot.');
  }
  if (fs.existsSync('scripts/hero-3d-before-375.png')) {
    fs.copyFileSync('scripts/hero-3d-before-375.png', path.join(artifactDir, 'hero-before-mobile-375.png'));
    console.log('Copied baseline mobile before screenshot.');
  }

  await page1440.close();
  await page375.close();
  await browser.close();
  console.log('\nAll capture and validation checks finished successfully!');
}

main().catch(console.error);
