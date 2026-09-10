import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function main() {
  const artDir = "C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\999af89a-ee76-483d-bd36-e97d5bd0eb27";

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--enable-gpu-rasterization', '--ignore-gpu-blocklist']
  });

  console.log('--- 1. Capturing Desktop (1440x900) ---');
  const page1440 = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });
  await page1440.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  console.log('Waiting 10s for multi-story building assembly sequence to complete...');
  await page1440.waitForTimeout(10000);

  const desktopIntro = await page1440.locator('#intro');
  const path1440 = path.join(artDir, 'hero-after-desktop-1440.png');
  await desktopIntro.screenshot({ path: path1440 });
  await desktopIntro.screenshot({ path: 'scripts/hero-after-desktop-1440.png' });
  console.log(`Saved desktop screenshot: ${path1440}`);

  // Also capture canvas still for dark & light fallback images
  const canvas = await page1440.locator('#intro canvas');
  if (await canvas.count() > 0) {
    await canvas.screenshot({ path: 'public/images/hero-glow-frame-light.png' });
    console.log('Updated public/images/hero-glow-frame-light.png');
  }

  // Toggle theme to dark to capture dark fallback image
  const themeBtn = await page1440.locator('button[aria-label*="theme"], button:has(.lucide-sun), button:has(.lucide-moon)').first();
  if (await themeBtn.count() > 0) {
    await themeBtn.click();
    await page1440.waitForTimeout(1000);
    if (await canvas.count() > 0) {
      await canvas.screenshot({ path: 'public/images/hero-glow-frame.png' });
      console.log('Updated public/images/hero-glow-frame.png');
    }
  }
  await page1440.close();

  console.log('\n--- 2. Capturing Mobile (375x812) ---');
  const page375 = await browser.newPage({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2
  });
  await page375.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page375.waitForTimeout(10000);

  const mobileIntro = await page375.locator('#intro');
  const path375 = path.join(artDir, 'hero-after-mobile-375.png');
  await mobileIntro.screenshot({ path: path375 });
  await mobileIntro.screenshot({ path: 'scripts/hero-after-mobile-375.png' });
  console.log(`Saved mobile screenshot: ${path375}`);
  await page375.close();

  console.log('\n--- 3. Checking Horizontal Overflow across Breakpoints ---');
  const viewports = [320, 375, 414, 768, 1024, 1440];
  const overflowResults = [];
  for (const w of viewports) {
    const p = await browser.newPage({ viewport: { width: w, height: 800 } });
    await p.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await p.waitForTimeout(2000);
    const overflow = await p.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
    }));
    console.log(`Viewport ${w}px: clientWidth=${overflow.clientWidth}, scrollWidth=${overflow.scrollWidth}, hasOverflow=${overflow.hasOverflow}`);
    overflowResults.push({ width: w, ...overflow });
    await p.close();
  }

  console.log('\n--- 4. Checking Reduced-Motion & No-WebGL Fallbacks ---');
  // Reduced motion
  const rmContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const rmPage = await rmContext.newPage();
  await rmPage.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await rmPage.waitForTimeout(1500);
  const rmCanvas = await rmPage.locator('#intro canvas').count();
  const rmImg = await rmPage.locator('#intro img').count();
  console.log(`prefers-reduced-motion: Canvas count=${rmCanvas}, FallbackImg count=${rmImg}`);
  await rmPage.locator('#intro').screenshot({ path: path.join(artDir, 'hero-reduced-motion-fallback.png') });
  await rmPage.close();
  await rmContext.close();

  // WebGL disabled
  const noGlContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const noGlPage = await noGlContext.newPage();
  await noGlPage.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await noGlPage.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await noGlPage.waitForTimeout(1500);
  const noGlCanvas = await noGlPage.locator('#intro canvas').count();
  const noGlImg = await noGlPage.locator('#intro img').count();
  console.log(`WebGL disabled: Canvas count=${noGlCanvas}, FallbackImg count=${noGlImg}`);
  await noGlPage.locator('#intro').screenshot({ path: path.join(artDir, 'hero-nowebgl-fallback.png') });
  await noGlPage.close();
  await noGlContext.close();

  await browser.close();
  console.log('\nAll capture and validation checks completed successfully!');
}

main().catch(console.error);
