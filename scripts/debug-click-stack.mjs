import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.getElementById('services')?.scrollIntoView({ behavior: 'instant', block: 'start' }));
  await page.waitForTimeout(500);

  // Click Learn more
  await page.click('#service-front-estimation button');
  await page.waitForTimeout(600);

  const backBtn = await page.$('#service-back-estimation button');
  const box = await backBtn.boundingBox();

  const allElements = await page.evaluate(({ x, y }) => {
    const list = document.elementsFromPoint(x, y);
    return list.map(el => ({
      tagName: el.tagName,
      id: el.id,
      className: el.className,
      style: el.getAttribute('style'),
      pointerEvents: window.getComputedStyle(el).pointerEvents,
      zIndex: window.getComputedStyle(el).zIndex
    }));
  }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });

  console.log('All elements at point:\n', JSON.stringify(allElements, null, 2));

  // Also check whether the click event fires when clicked directly in DOM
  const eventFired = await page.evaluate(() => {
    let fired = false;
    const btn = document.querySelector('#service-back-estimation button');
    btn.addEventListener('click', () => { fired = true; }, { once: true });
    btn.click();
    return fired;
  });
  console.log('Native HTMLElement.click() fired listener:', eventFired);

  await page.waitForTimeout(600);
  const frontVisible = await page.evaluate(() => {
    return document.getElementById('service-front-estimation')?.getAttribute('aria-hidden');
  });
  console.log('Front aria-hidden after native click:', frontVisible);

  await browser.close();
})().catch(console.error);
