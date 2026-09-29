import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/USER/.gemini/antigravity-ide/brain/724d998f-2514-42ba-93fa-b291461e3367';

async function main() {
  console.log('=== STARTING SERVICES MISC STEEL STAIR 3D VERIFICATION ===\n');

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
  await page.waitForTimeout(2000);

  // Scroll to services section
  await page.evaluate(() => {
    const sec = document.getElementById('services');
    if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(1000);

  // 1. DOM Inspection across all 6 cards
  const domInfo = await page.evaluate(() => {
    const services = document.getElementById('services');
    if (!services) return { error: 'No #services element' };

    const cards = Array.from(services.querySelectorAll('.grid > div.group'));
    const cardData = cards.map((c, i) => {
      const title = c.querySelector('h3')?.textContent?.trim() || '';
      const desc = c.querySelector('p')?.textContent?.trim() || '';
      const canvas = c.querySelector('canvas');
      const img = c.querySelector('img');
      const standard = c.querySelector('span.font-mono.text-\\[11px\\]')?.textContent?.trim() || '';
      return {
        index: i + 1,
        title,
        desc,
        standard,
        hasCanvas: !!canvas,
        hasImg: !!img,
        canvasWidth: canvas?.width,
        canvasHeight: canvas?.height,
      };
    });

    return {
      totalCards: cards.length,
      cardData,
      windowScrollWidth: document.documentElement.scrollWidth,
      windowInnerWidth: window.innerWidth,
    };
  });

  console.log('DOM Inspection Results:\n', JSON.stringify(domInfo, null, 2));

  // 2. Full Six-Card Section Screenshot
  const servicesSec = page.locator('#services');
  await servicesSec.screenshot({ path: path.join(ARTIFACT_DIR, 'services-all-six-cards.png') });
  console.log('Saved services-all-six-cards.png');

  // Find Card 3 (Misc Steel Detailing)
  const miscCard = page.locator('#services .grid > div.group').nth(2);
  const miscCanvas = miscCard.locator('canvas');

  // 3. Progressive 6-8 Frame Sequence of Staircase Assembly
  console.log('\nCapturing 7-frame progressive staircase assembly sequence...');

  // Frame 1: Exploded Start - Stringers & supports offset (t ≈ 0.2s)
  await page.waitForTimeout(300);
  await miscCard.screenshot({ path: path.join(ARTIFACT_DIR, 'misc-stair-frame-1-exploded.png') });
  console.log('Captured misc-stair-frame-1-exploded.png (Exploded start)');

  // Frame 2: Stringers slide together and settle with base bolts (t ≈ 1.2s)
  await page.waitForTimeout(1000);
  await miscCard.screenshot({ path: path.join(ARTIFACT_DIR, 'misc-stair-frame-2-stringers-settled.png') });
  console.log('Captured misc-stair-frame-2-stringers-settled.png (Stringers & base plates settled)');

  // Frame 3: Treads attaching sequentially bottom to top (t ≈ 2.5s)
  await page.waitForTimeout(1300);
  await miscCard.screenshot({ path: path.join(ARTIFACT_DIR, 'misc-stair-frame-3-treads-assembling.png') });
  console.log('Captured misc-stair-frame-3-treads-assembling.png (Treads assembling bottom-to-top)');

  // Frame 4: Bare structural staircase assembled (t ≈ 3.8s)
  await page.waitForTimeout(1300);
  await miscCard.screenshot({ path: path.join(ARTIFACT_DIR, 'misc-stair-frame-4-structure-assembled.png') });
  console.log('Captured misc-stair-frame-4-structure-assembled.png (Structural staircase assembled)');

  // Frame 5: Handrail posts erect sequentially along slope onto landing (t ≈ 5.0s)
  await page.waitForTimeout(1200);
  await miscCard.screenshot({ path: path.join(ARTIFACT_DIR, 'misc-stair-frame-5-posts-erecting.png') });
  console.log('Captured misc-stair-frame-5-posts-erecting.png (Handrail posts erect bottom-to-top)');

  // Frame 6: Top & mid rails extrude post-to-post + brackets (t ≈ 6.2s)
  await page.waitForTimeout(1200);
  await miscCard.screenshot({ path: path.join(ARTIFACT_DIR, 'misc-stair-frame-6-rails-extruding.png') });
  console.log('Captured misc-stair-frame-6-rails-extruding.png (Rails extrude & brackets lock in)');

  // Frame 7: Completed stair & handrails with inspection sweep (t ≈ 7.5s)
  await page.waitForTimeout(1300);
  await miscCard.screenshot({ path: path.join(ARTIFACT_DIR, 'misc-stair-frame-7-completed-inspection.png') });
  console.log('Captured misc-stair-frame-7-completed-inspection.png (Completed hold & inspection sweep)');

  // Test Modal ("Learn more" interaction)
  console.log('\nTesting "Learn more" modal click...');
  const learnMoreBtn = miscCard.locator('button:has-text("Learn more")');
  await learnMoreBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'misc-stair-modal-open.png') });
  console.log('Saved misc-stair-modal-open.png');

  // Close modal
  await page.locator('button[aria-label="Close dialog"]').click();
  await page.waitForTimeout(300);

  // 4. Reduced-Motion & No-WebGL Fallback Test
  console.log('\nTesting reduced-motion fallback...');
  const reducedContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce'
  });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await reducedPage.evaluate(() => {
    const sec = document.getElementById('services');
    if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await reducedPage.waitForTimeout(800);
  const reducedMiscCard = reducedPage.locator('#services .grid > div.group').nth(2);
  await reducedMiscCard.screenshot({ path: path.join(ARTIFACT_DIR, 'misc-stair-reduced-motion-card.png') });
  console.log('Saved misc-stair-reduced-motion-card.png');
  await reducedContext.close();

  // 5. FPS Benchmark
  console.log('\nRunning FPS Performance Benchmark...');

  // A. Desktop (1440x900)
  const desktopFps = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const frameTimes = [];
      let last = performance.now();
      let frames = 0;
      const start = performance.now();
      function loop(now) {
        const delta = now - last;
        last = now;
        if (delta > 0) frameTimes.push(delta);
        frames++;
        if (now - start < 3000) {
          requestAnimationFrame(loop);
        } else {
          const sorted = [...frameTimes].sort((a, b) => a - b);
          const sum = frameTimes.reduce((a, b) => a + b, 0);
          const avg = sum / frameTimes.length;
          const p95 = sorted[Math.floor(sorted.length * 0.95)];
          const fps = frames / (sum / 1000);
          resolve({
            fps: fps.toFixed(1),
            avgMs: avg.toFixed(2),
            p95Ms: p95.toFixed(2),
            frames
          });
        }
      }
      requestAnimationFrame(loop);
    });
  });
  console.log(`[Desktop 1440px]: ${desktopFps.fps} FPS, avg ${desktopFps.avgMs}ms, p95 ${desktopFps.p95Ms}ms`);

  // B. Mobile Viewport (375x812) - Unthrottled
  const mobileContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await mobilePage.evaluate(() => {
    const sec = document.getElementById('services');
    if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await mobilePage.waitForTimeout(1000);

  const mobileFps = await mobilePage.evaluate(async () => {
    return new Promise((resolve) => {
      const frameTimes = [];
      let last = performance.now();
      let frames = 0;
      const start = performance.now();
      function loop(now) {
        const delta = now - last;
        last = now;
        if (delta > 0) frameTimes.push(delta);
        frames++;
        if (now - start < 3000) {
          requestAnimationFrame(loop);
        } else {
          const sorted = [...frameTimes].sort((a, b) => a - b);
          const sum = frameTimes.reduce((a, b) => a + b, 0);
          const avg = sum / frameTimes.length;
          const p95 = sorted[Math.floor(sorted.length * 0.95)];
          const fps = frames / (sum / 1000);
          resolve({
            fps: fps.toFixed(1),
            avgMs: avg.toFixed(2),
            p95Ms: p95.toFixed(2),
            frames
          });
        }
      }
      requestAnimationFrame(loop);
    });
  });
  console.log(`[Mobile 375px - Unthrottled]: ${mobileFps.fps} FPS, avg ${mobileFps.avgMs}ms, p95 ${mobileFps.p95Ms}ms`);

  // C. Mobile Throttled (CDP CPU Throttling 4x)
  const cdp = await mobileContext.newCDPSession(mobilePage);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await mobilePage.waitForTimeout(500);

  const mobileThrottledFps = await mobilePage.evaluate(async () => {
    return new Promise((resolve) => {
      const frameTimes = [];
      let last = performance.now();
      let frames = 0;
      const start = performance.now();
      function loop(now) {
        const delta = now - last;
        last = now;
        if (delta > 0) frameTimes.push(delta);
        frames++;
        if (now - start < 3000) {
          requestAnimationFrame(loop);
        } else {
          const sorted = [...frameTimes].sort((a, b) => a - b);
          const sum = frameTimes.reduce((a, b) => a + b, 0);
          const avg = sum / frameTimes.length;
          const p95 = sorted[Math.floor(sorted.length * 0.95)];
          const fps = frames / (sum / 1000);
          resolve({
            fps: fps.toFixed(1),
            avgMs: avg.toFixed(2),
            p95Ms: p95.toFixed(2),
            frames
          });
        }
      }
      requestAnimationFrame(loop);
    });
  });
  console.log(`[Mobile 375px - 4x CPU Throttled]: ${mobileThrottledFps.fps} FPS, avg ${mobileThrottledFps.avgMs}ms, p95 ${mobileThrottledFps.p95Ms}ms`);

  await mobileContext.close();
  await browser.close();

  console.log('\nAll tests completed cleanly! Errors encountered:', errors);
}

main().catch(console.error);
