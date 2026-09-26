import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.getElementById('services')?.scrollIntoView({ behavior: 'instant', block: 'start' }));
  await page.waitForTimeout(500);

  console.log('1. Clicking Learn more...');
  await page.click('#service-front-estimation button');
  await page.waitForTimeout(1000);

  console.log('2. Inspecting button visibility and properties:');
  const btnProps = await page.evaluate(() => {
    const btn = document.querySelector('#service-back-estimation button');
    const backFace = document.getElementById('service-back-estimation');
    const frontFace = document.getElementById('service-front-estimation');
    const rect = btn?.getBoundingClientRect();
    return {
      btnExists: !!btn,
      btnText: btn?.textContent,
      rect,
      btnComputedStyle: {
        display: window.getComputedStyle(btn).display,
        visibility: window.getComputedStyle(btn).visibility,
        opacity: window.getComputedStyle(btn).opacity,
        pointerEvents: window.getComputedStyle(btn).pointerEvents,
      },
      backFaceComputedStyle: {
        display: window.getComputedStyle(backFace).display,
        visibility: window.getComputedStyle(backFace).visibility,
        opacity: window.getComputedStyle(backFace).opacity,
        pointerEvents: window.getComputedStyle(backFace).pointerEvents,
        transform: window.getComputedStyle(backFace).transform,
      },
      frontFaceComputedStyle: {
        opacity: window.getComputedStyle(frontFace).opacity,
        pointerEvents: window.getComputedStyle(frontFace).pointerEvents,
      }
    };
  });
  console.log(JSON.stringify(btnProps, null, 2));

  console.log('3. Trying mouse click at bounding box center...');
  const box = await (await page.$('#service-back-estimation button')).boundingBox();
  console.log('Target click coordinate:', box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(800);

  const restored = await page.evaluate(() => {
    return document.getElementById('service-front-estimation')?.getAttribute('aria-hidden');
  });
  console.log('Front aria-hidden after mouse click:', restored);

  await browser.close();
})().catch(console.error);
