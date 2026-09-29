import { chromium } from 'playwright';

async function captureNetwork() {
  const browser = await chromium.launch();

  const viewports = [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 812 }
  ];

  const themes = ['dark', 'light'];

  for (const theme of themes) {
    for (const vp of viewports) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

      await page.evaluate((th) => {
        if (th === 'light') {
          document.documentElement.classList.add('light');
        } else {
          document.documentElement.classList.remove('light');
        }
      }, theme);
      await page.waitForTimeout(400);

      const sectionEl = await page.$('#global-network');
      if (sectionEl) {
        await sectionEl.scrollIntoViewIfNeeded();
        await page.waitForTimeout(600);
        await sectionEl.screenshot({ path: `scripts/network-${theme}-${vp.name}.png` });
        console.log(`Saved: scripts/network-${theme}-${vp.name}.png`);
      }

      // Also capture the full footer area with the architectural transition
      const footerEl = await page.$('#site-footer');
      if (footerEl) {
        await footerEl.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await footerEl.screenshot({ path: `scripts/footer-full-${theme}-${vp.name}.png` });
        console.log(`Saved: scripts/footer-full-${theme}-${vp.name}.png`);
      }

      await page.close();
    }
  }

  await browser.close();
  console.log('All screenshots captured successfully!');
}

captureNetwork().catch(console.error);
