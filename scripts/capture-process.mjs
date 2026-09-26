import { chromium } from 'playwright';

async function captureProcess() {
  const browser = await chromium.launch();

  const themes = ['dark', 'light'];

  for (const theme of themes) {
    const p = await browser.newPage({ viewport: { width: 1440, height: 1150 } });
    await p.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    await p.evaluate((th) => {
      if (th === 'light') {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    }, theme);

    await p.waitForTimeout(400);

    const processEl = await p.$('#process');
    if (processEl) {
      await processEl.scrollIntoViewIfNeeded();
      await p.evaluate(() => window.scrollBy(0, -80)); // clear sticky nav
      await p.waitForTimeout(400);

      const pauseBtn = await p.$('button[aria-label="Pause auto-advance"]');
      if (pauseBtn) await pauseBtn.click();
      await p.waitForTimeout(200);

      const btns = await p.$$('#process button[aria-label^="Select"]');
      if (btns.length >= 6) {
        // Step 1
        await btns[0].click();
        await p.waitForTimeout(400);
        await p.screenshot({ path: `scripts/process-${theme}-step1.png`, clip: await processEl.boundingBox() });
        console.log(`Saved: scripts/process-${theme}-step1.png`);

        // Step 3
        await btns[2].click();
        await p.waitForTimeout(400);
        await p.screenshot({ path: `scripts/process-${theme}-step3.png`, clip: await processEl.boundingBox() });
        console.log(`Saved: scripts/process-${theme}-step3.png`);

        // Step 6
        await btns[5].click();
        await p.waitForTimeout(400);
        await p.screenshot({ path: `scripts/process-${theme}-step6.png`, clip: await processEl.boundingBox() });
        console.log(`Saved: scripts/process-${theme}-step6.png`);
      }
    }
    await p.close();
  }

  // Mobile viewport capture
  const mobPage = await browser.newPage({ viewport: { width: 375, height: 950 } });
  await mobPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  const mobProcess = await mobPage.$('#process');
  if (mobProcess) {
    await mobProcess.scrollIntoViewIfNeeded();
    await mobPage.evaluate(() => window.scrollBy(0, -60));
    await mobPage.waitForTimeout(500);
    await mobPage.screenshot({ path: 'scripts/process-mobile-dark.png' });
    console.log('Saved: scripts/process-mobile-dark.png');
  }
  await mobPage.close();

  await browser.close();
  console.log('All process screenshots captured cleanly!');
}

captureProcess().catch(console.error);
