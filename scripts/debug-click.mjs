import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.getElementById('services')?.scrollIntoView({ behavior: 'instant', block: 'start' }));
  await page.waitForTimeout(500);

  // Click Learn more on Card 0
  const learnMoreBtn = await page.$('#service-front-estimation button');
  console.log('Learn more button found:', !!learnMoreBtn);
  await learnMoreBtn.click();
  await page.waitForTimeout(600);

  // Now inspect what element is at the position of Back to overview button
  const backBtn = await page.$('#service-back-estimation button');
  console.log('Back button found:', !!backBtn);
  const box = await backBtn.boundingBox();
  console.log('Back button bounding box:', box);

  const hitElement = await page.evaluate(({ x, y }) => {
    const el = document.elementFromPoint(x, y);
    return {
      tagName: el?.tagName,
      id: el?.id,
      className: el?.className,
      textContent: el?.textContent?.trim()?.slice(0, 50),
      parentTag: el?.parentElement?.tagName,
      parentId: el?.parentElement?.id,
      parentClass: el?.parentElement?.className
    };
  }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
  console.log('Element at click coordinates:', JSON.stringify(hitElement, null, 2));

  // Try clicking back button
  try {
    await backBtn.click({ timeout: 2000 });
    console.log('Click on backBtn succeeded');
  } catch (e) {
    console.log('Click on backBtn failed:', e.message);
  }

  await page.waitForTimeout(600);
  const isFrontVisible = await page.evaluate(() => {
    const front = document.getElementById('service-front-estimation');
    const back = document.getElementById('service-back-estimation');
    return {
      frontAriaHidden: front?.getAttribute('aria-hidden'),
      backAriaHidden: back?.getAttribute('aria-hidden')
    };
  });
  console.log('After click state:', isFrontVisible);

  await browser.close();
})().catch(console.error);
