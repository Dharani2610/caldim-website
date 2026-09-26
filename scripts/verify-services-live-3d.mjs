import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function runComprehensiveVerification() {
  console.log('=== STARTING COMPREHENSIVE LIVE SERVICES 3D VERIFICATION ===\n');

  const browser = await chromium.launch();
  const consoleErrors = [];
  const consoleWarnings = [];

  // 1. DESKTOP TEST & DOM INSPECTION
  console.log('--- TEST 1: DESKTOP LIVE DOM INSPECTION & ERROR CHECK ---');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await desktopContext.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
    if (msg.type() === 'warning') consoleWarnings.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Scroll to services
  await page.evaluate(() => {
    document.getElementById('services')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(1500); // Allow WebGL canvases to mount and initialize

  const domInspection = await page.evaluate(() => {
    const section = document.getElementById('services');
    if (!section) return { error: 'Section #services not found' };

    const canvases = Array.from(section.querySelectorAll('canvas'));
    const allImages = Array.from(section.querySelectorAll('img')).map(img => img.src);
    const vignetteImages = allImages.filter(src => src.includes('vignette-'));
    const cards = Array.from(section.querySelectorAll('.premium-card'));

    const cardDetails = cards.map((card, i) => {
      const title = card.querySelector('h3')?.textContent?.trim();
      const standard = card.querySelector('.label-mono-sm')?.textContent?.trim();
      const hasCanvas = !!card.querySelector('canvas');
      const hasGlowImg = !!card.querySelector('img[src*="vignette-"]');
      const canvasWidth = card.querySelector('canvas')?.width;
      const canvasHeight = card.querySelector('canvas')?.height;
      return { index: i, title, standard, hasCanvas, canvasWidth, canvasHeight, hasGlowImg };
    });

    return {
      totalCanvases: canvases.length,
      vignetteImageCount: vignetteImages.length,
      vignetteImages,
      cardCount: cards.length,
      cardDetails
    };
  });

  console.log('DOM Inspection Result:');
  console.log(JSON.stringify(domInspection, null, 2));
  console.log(`Console Errors (${consoleErrors.length}):`, consoleErrors);
  console.log(`Console Warnings (${consoleWarnings.length}):`, consoleWarnings);

  // 2. SCREENSHOTS (DESKTOP FULL SECTION, FULL CARD, CLOSE-UP VIGNETTE)
  console.log('\n--- CAPTURING VISUAL EVIDENCE SCREENSHOTS ---');
  const servicesSection = await page.$('#services');
  if (servicesSection) {
    await servicesSection.screenshot({ path: 'scripts/services-3d-live-section.png' });
    console.log('Saved: scripts/services-3d-live-section.png');
  }

  // Screenshot first card with all premium styling & live canvas
  const firstCard = await page.$('.premium-card');
  if (firstCard) {
    await firstCard.screenshot({ path: 'scripts/services-3d-live-single-card.png' });
    console.log('Saved: scripts/services-3d-live-single-card.png');
  }

  // Screenshot close-up of structural vignette canvas
  const firstCanvas = await page.$('#services canvas');
  if (firstCanvas) {
    await firstCanvas.screenshot({ path: 'scripts/services-3d-live-vignette-closeup.png' });
    console.log('Saved: scripts/services-3d-live-vignette-closeup.png');
  }

  // 3. FPS BENCHMARK (DESKTOP)
  console.log('\n--- TEST 2: FPS BENCHMARK (DESKTOP 1440x900) ---');
  const desktopFps = await page.evaluate(async () => {
    return new Promise((resolve) => {
      let frameCount = 0;
      let lastTime = performance.now();
      const startTime = lastTime;
      const frameDeltas = [];

      function measure(now) {
        frameCount++;
        frameDeltas.push(now - lastTime);
        lastTime = now;
        if (now - startTime < 3000) {
          requestAnimationFrame(measure);
        } else {
          const totalDuration = now - startTime;
          const avgFps = (frameCount / totalDuration) * 1000;
          const sortedDeltas = frameDeltas.sort((a, b) => a - b);
          const p95Delta = sortedDeltas[Math.floor(sortedDeltas.length * 0.95)];
          const minFps = 1000 / sortedDeltas[sortedDeltas.length - 1];
          resolve({
            avgFps: parseFloat(avgFps.toFixed(1)),
            frameCount,
            durationMs: parseFloat(totalDuration.toFixed(1)),
            p95FrameTimeMs: parseFloat(p95Delta.toFixed(2)),
            minFps: parseFloat(minFps.toFixed(1))
          });
        }
      }
      requestAnimationFrame(measure);
    });
  });
  console.log('Desktop FPS Results:', desktopFps);
  await desktopContext.close();

  // 4. FPS BENCHMARK (MOBILE UNTHROTTLED)
  console.log('\n--- TEST 3: FPS BENCHMARK (MOBILE UNTHROTTLED 375x667) ---');
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 667 },
    isMobile: true
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await mobilePage.evaluate(() => {
    document.getElementById('services')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await mobilePage.waitForTimeout(1500);

  const mobileFps = await mobilePage.evaluate(async () => {
    return new Promise((resolve) => {
      let frameCount = 0;
      let lastTime = performance.now();
      const startTime = lastTime;
      const frameDeltas = [];

      function measure(now) {
        frameCount++;
        frameDeltas.push(now - lastTime);
        lastTime = now;
        if (now - startTime < 3000) {
          requestAnimationFrame(measure);
        } else {
          const totalDuration = now - startTime;
          const avgFps = (frameCount / totalDuration) * 1000;
          const sortedDeltas = frameDeltas.sort((a, b) => a - b);
          const p95Delta = sortedDeltas[Math.floor(sortedDeltas.length * 0.95)];
          resolve({
            avgFps: parseFloat(avgFps.toFixed(1)),
            frameCount,
            durationMs: parseFloat(totalDuration.toFixed(1)),
            p95FrameTimeMs: parseFloat(p95Delta.toFixed(2))
          });
        }
      }
      requestAnimationFrame(measure);
    });
  });
  console.log('Mobile Unthrottled FPS Results:', mobileFps);

  // 5. FPS BENCHMARK (MOBILE 4X CPU THROTTLED)
  console.log('\n--- TEST 4: FPS BENCHMARK (MOBILE 4X THROTTLED) ---');
  const cdpSession = await mobileContext.newCDPSession(mobilePage);
  await cdpSession.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await mobilePage.waitForTimeout(500);

  const mobileThrottledFps = await mobilePage.evaluate(async () => {
    return new Promise((resolve) => {
      let frameCount = 0;
      let lastTime = performance.now();
      const startTime = lastTime;
      const frameDeltas = [];

      function measure(now) {
        frameCount++;
        frameDeltas.push(now - lastTime);
        lastTime = now;
        if (now - startTime < 3000) {
          requestAnimationFrame(measure);
        } else {
          const totalDuration = now - startTime;
          const avgFps = (frameCount / totalDuration) * 1000;
          const sortedDeltas = frameDeltas.sort((a, b) => a - b);
          const p95Delta = sortedDeltas[Math.floor(sortedDeltas.length * 0.95)];
          resolve({
            avgFps: parseFloat(avgFps.toFixed(1)),
            frameCount,
            durationMs: parseFloat(totalDuration.toFixed(1)),
            p95FrameTimeMs: parseFloat(p95Delta.toFixed(2))
          });
        }
      }
      requestAnimationFrame(measure);
    });
  });
  console.log('Mobile 4x Throttled FPS Results:', mobileThrottledFps);
  await mobileContext.close();

  // 6. REDUCED-MOTION FALLBACK TEST
  console.log('\n--- TEST 5: PREFERS-REDUCED-MOTION FALLBACK DOM TEST ---');
  const reducedMotionContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce'
  });
  const reducedPage = await reducedMotionContext.newPage();
  await reducedPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await reducedPage.evaluate(() => {
    document.getElementById('services')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await reducedPage.waitForTimeout(1000);

  const reducedMotionInspection = await reducedPage.evaluate(() => {
    const section = document.getElementById('services');
    const canvases = section.querySelectorAll('canvas').length;
    const svgs = section.querySelectorAll('svg').length;
    return { canvases, svgs };
  });
  console.log('Reduced Motion DOM Inspection (Target: canvases === 0):', reducedMotionInspection);

  const reducedSection = await reducedPage.$('#services');
  if (reducedSection) {
    await reducedSection.screenshot({ path: 'scripts/services-reduced-motion-fallback.png' });
    console.log('Saved: scripts/services-reduced-motion-fallback.png');
  }
  await reducedMotionContext.close();

  // 7. NO-WEBGL FALLBACK TEST
  console.log('\n--- TEST 6: NO-WEBGL FALLBACK DOM TEST ---');
  const noWebglContext = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  await noWebglContext.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = function (type) {
      if (type.includes('webgl')) return null;
      return null;
    };
  });
  const noWebglPage = await noWebglContext.newPage();
  await noWebglPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await noWebglPage.evaluate(() => {
    document.getElementById('services')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await noWebglPage.waitForTimeout(1000);

  const noWebglInspection = await noWebglPage.evaluate(() => {
    const section = document.getElementById('services');
    const canvases = section.querySelectorAll('canvas').length;
    const svgs = section.querySelectorAll('svg').length;
    return { canvases, svgs };
  });
  console.log('No-WebGL DOM Inspection (Target: canvases === 0):', noWebglInspection);
  await noWebglContext.close();

  await browser.close();
  console.log('\n=== ALL TESTS COMPLETED SUCCESSFULLY ===');
}

runComprehensiveVerification().catch(console.error);
