import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ 
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
    reducedMotion: 'reduce'
  });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.locator('#leadership').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const card = await page.$('#leadership [tabindex="0"]');
  const box = await card.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(300);

  await page.screenshot({
    path: 'scripts/card-1-no-bio-badge.png',
    clip: { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) }
  });
  await browser.close();
  console.log('Captured without BIO badge.');
}

main().catch(console.error);
