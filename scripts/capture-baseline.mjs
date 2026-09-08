import { chromium } from 'playwright';

async function captureBaseline() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  // 1. Desktop 1440px
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });
    // Wait for assembly animation to finish and settle
    await page.waitForTimeout(4500);

    const introSection = await page.$('#intro');
    if (introSection) {
      await introSection.screenshot({ path: 'scripts/hero-3d-before-1440.png' });
      console.log('Captured scripts/hero-3d-before-1440.png');
    }
    await context.close();
  }

  // 2. Mobile 375px
  {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await context.newPage();
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);

    const introSection = await page.$('#intro');
    if (introSection) {
      await introSection.screenshot({ path: 'scripts/hero-3d-before-375.png' });
      console.log('Captured scripts/hero-3d-before-375.png');
    }
    await context.close();
  }

  // 3. FPS & Frame time benchmark
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });

    const perf = await page.evaluate(async () => {
      await new Promise(r => setTimeout(r, 1500));
      return new Promise(resolve => {
        let frames = 0;
        let lastTime = performance.now();
        const frameTimes = [];

        function step(now) {
          frames++;
          const delta = now - lastTime;
          lastTime = now;
          if (frames > 1) frameTimes.push(delta);

          if (frames < 120) {
            requestAnimationFrame(step);
          } else {
            const avgDelta = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
            const fps = 1000 / avgDelta;
            resolve({ avgDelta: avgDelta.toFixed(2), fps: fps.toFixed(1) });
          }
        }
        requestAnimationFrame(step);
      });
    });

    console.log('Baseline Performance:', perf);
    await context.close();
  }

  await browser.close();
}

captureBaseline().catch(console.error);
