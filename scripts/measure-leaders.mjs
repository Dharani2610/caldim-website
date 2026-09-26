import { chromium } from 'playwright';

async function measure() {
  const browser = await chromium.launch();
  
  // Test desktop with prefers-reduced-motion so there is no 3D tilt/animation offset
  const page = await browser.newPage({ 
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce'
  });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.locator('#leadership').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const desktop = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('#leadership article'));
    return cards.map((c, i) => {
      const rect = c.getBoundingClientRect();
      const photo = c.querySelector('div.relative.aspect-square');
      const photoRect = photo ? photo.getBoundingClientRect() : null;
      const textPlane = c.querySelector('div.relative.p-6');
      const textRect = textPlane ? textPlane.getBoundingClientRect() : null;
      const name = c.querySelector('h3')?.innerText;
      return {
        index: i,
        name,
        offsetWidth: c.offsetWidth,
        offsetHeight: c.offsetHeight,
        rectWidth: rect.width,
        rectHeight: rect.height,
        photoWidth: photoRect?.width,
        photoHeight: photoRect?.height,
        textHeight: textRect?.height,
      };
    });
  });

  console.log('--- Desktop (1440px viewport) ---');
  console.table(desktop);

  // Mobile 375px
  const pageMobile = await browser.newPage({ 
    viewport: { width: 375, height: 812 },
    reducedMotion: 'reduce'
  });
  await pageMobile.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await pageMobile.locator('#leadership').scrollIntoViewIfNeeded();
  await pageMobile.waitForTimeout(500);

  const mobile = await pageMobile.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('#leadership article'));
    return cards.map((c, i) => {
      const rect = c.getBoundingClientRect();
      const name = c.querySelector('h3')?.innerText;
      return {
        index: i,
        name,
        offsetWidth: c.offsetWidth,
        offsetHeight: c.offsetHeight,
        rectWidth: rect.width,
        rectHeight: rect.height,
      };
    });
  });

  console.log('--- Mobile (375px viewport) ---');
  console.table(mobile);

  await browser.close();
}

measure().catch(console.error);
