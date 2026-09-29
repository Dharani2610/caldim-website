import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();

  for (const mode of ['dark', 'light']) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      colorScheme: mode,
      reducedMotion: 'reduce'
    });

    await page.addInitScript((m) => {
      localStorage.setItem('caldim-theme', m);
    }, mode);

    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    await page.locator('#leadership').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Save full section screenshot
    await page.locator('#leadership').screenshot({ path: `scripts/leadership-${mode}-all-default.png` });

    // Capture each of the 4 cards in default and revealed states
    const cards = await page.$$('#leadership [tabindex="0"]');
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const h3Name = await card.$eval('h3', el => el.innerText.trim());
      const slug = h3Name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const box = await card.boundingBox();

      // Default
      await page.screenshot({
        path: `scripts/leader-${i + 1}-${slug}-${mode}-default.png`,
        clip: { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) }
      });

      // Hover
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(300);

      // Revealed
      await page.screenshot({
        path: `scripts/leader-${i + 1}-${slug}-${mode}-revealed.png`,
        clip: { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) }
      });

      await page.mouse.move(0, 0);
      await page.waitForTimeout(200);
    }

    await page.close();
  }

  await browser.close();
  console.log('All theme screenshots successfully captured.');
}

main().catch(console.error);
