import { chromium } from 'playwright';

async function benchmark() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--enable-gpu-rasterization', '--ignore-gpu-blocklist']
  });

  console.log('=== RUNNING FPS / FRAME TIME PERFORMANCE BENCHMARK ===\n');

  // 1. Desktop Unthrottled (1440x900)
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000); // Wait for scene to mount and start

    const res = await page.evaluate(async () => {
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
            const fps = (frames / (sum / 1000));
            resolve({
              avgFps: fps.toFixed(1),
              avgFrameTimeMs: avg.toFixed(2),
              p95FrameTimeMs: p95.toFixed(2),
              totalFrames: frames
            });
          }
        }
        requestAnimationFrame(loop);
      });
    });

    console.log(`[Desktop 1440px - Unthrottled]`);
    console.log(`- Average FPS: ${res.avgFps} fps`);
    console.log(`- Avg Frame Time: ${res.avgFrameTimeMs} ms`);
    console.log(`- 95th Percentile Frame Time: ${res.p95FrameTimeMs} ms`);
    console.log(`- Frames Sampled: ${res.totalFrames}\n`);
    await page.close();
  }

  // 2. Mobile Viewport (375x812) - Unthrottled
  {
    const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);

    const res = await page.evaluate(async () => {
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
            const fps = (frames / (sum / 1000));
            resolve({
              avgFps: fps.toFixed(1),
              avgFrameTimeMs: avg.toFixed(2),
              p95FrameTimeMs: p95.toFixed(2),
              totalFrames: frames
            });
          }
        }
        requestAnimationFrame(loop);
      });
    });

    console.log(`[Mobile 375px - Unthrottled]`);
    console.log(`- Average FPS: ${res.avgFps} fps`);
    console.log(`- Avg Frame Time: ${res.avgFrameTimeMs} ms`);
    console.log(`- 95th Percentile Frame Time: ${res.p95FrameTimeMs} ms`);
    console.log(`- Frames Sampled: ${res.totalFrames}\n`);
    await page.close();
  }

  // 3. Mobile Viewport (375x812) - 4x CPU Throttled Profile
  {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await context.newPage();
    const client = await context.newCDPSession(page);
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);

    const res = await page.evaluate(async () => {
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
            const fps = (frames / (sum / 1000));
            resolve({
              avgFps: fps.toFixed(1),
              avgFrameTimeMs: avg.toFixed(2),
              p95FrameTimeMs: p95.toFixed(2),
              totalFrames: frames
            });
          }
        }
        requestAnimationFrame(loop);
      });
    });

    console.log(`[Mobile 375px - 4x CPU Throttled Profile]`);
    console.log(`- Average FPS: ${res.avgFps} fps`);
    console.log(`- Avg Frame Time: ${res.avgFrameTimeMs} ms`);
    console.log(`- 95th Percentile Frame Time: ${res.p95FrameTimeMs} ms`);
    console.log(`- Frames Sampled: ${res.totalFrames}\n`);
    await context.close();
  }

  await browser.close();
}

benchmark().catch(console.error);
