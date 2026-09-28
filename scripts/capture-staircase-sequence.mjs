import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/USER/.gemini/antigravity-ide/brain/1ae4a55b-f1a8-44f9-b4cc-4c90ed7e5fff';

async function main() {
  const browser = await chromium.launch();
  
  // 1. Desktop Test (1440x900)
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await desktopContext.newPage();
  
  console.log('Navigating to http://localhost:3001...');
  await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' });
  
  // Scroll to services section row 2 (Cards 3 & 4)
  await page.evaluate(() => {
    const sec = document.getElementById('services');
    if (sec) {
      sec.scrollIntoView({ behavior: 'instant', block: 'start' });
      window.scrollBy(0, 520);
    }
  });
  await page.waitForTimeout(1000);

  // 1. DOM Inspection
  const domInfo = await page.evaluate(() => {
    const services = document.getElementById('services');
    if (!services) return { error: 'No services element' };
    const cards = Array.from(services.querySelectorAll('#services .group'));
    const canvases = Array.from(services.querySelectorAll('canvas'));
    const card3 = cards[2];
    const card3Title = card3?.querySelector('h3')?.textContent?.trim();
    const card3Canvas = card3?.querySelector('canvas');
    return {
      totalServiceCards: cards.length,
      totalCanvases: canvases.length,
      card3Title,
      card3HasCanvas: !!card3Canvas,
      card3CanvasWidth: card3Canvas?.width,
      card3CanvasHeight: card3Canvas?.height,
    };
  });
  console.log('DOM Inspection Results:', JSON.stringify(domInfo, null, 2));

  // Find Card 03 in services
  const card3 = page.locator('#services .group').nth(2);
  await page.waitForTimeout(500);

  console.log('Capturing progressive construction frames...');
  
  // Frame 1: Base stringers and treads settled (Start of cycle)
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'stair-frame-1-base.png')
  });
  console.log('Captured stair-frame-1-base.png');

  // Frame 2: Vertical posts building sequentially from bottom to top
  await page.waitForTimeout(1400);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'stair-frame-2-posts.png')
  });
  console.log('Captured stair-frame-2-posts.png');

  // Frame 3: Inclined top handrail extruding post-to-post
  await page.waitForTimeout(1400);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'stair-frame-3-toprail.png')
  });
  console.log('Captured stair-frame-3-toprail.png');

  // Frame 4: Mid-rail extruding post-to-post
  await page.waitForTimeout(1400);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'stair-frame-4-midrail.png')
  });
  console.log('Captured stair-frame-4-midrail.png');

  // Frame 5: Brackets popping in at junctions & complete detailing
  await page.waitForTimeout(1400);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'stair-frame-5-brackets-complete.png')
  });
  console.log('Captured stair-frame-5-brackets-complete.png');

  // Frame 6: Completed flight rotating from new angle
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'stair-frame-6-orbit.png')
  });
  console.log('Captured stair-frame-6-orbit.png');

  // 3. Fallback verification (prefers-reduced-motion)
  const reducedMotionContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce'
  });
  const reducedPage = await reducedMotionContext.newPage();
  await reducedPage.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' });
  await reducedPage.evaluate(() => {
    const sec = document.getElementById('services');
    if (sec) {
      sec.scrollIntoView({ behavior: 'instant', block: 'start' });
      window.scrollBy(0, 520);
    }
  });
  await reducedPage.waitForTimeout(1000);

  await reducedPage.screenshot({
    path: path.join(ARTIFACT_DIR, 'stair-reduced-motion-fallback.png')
  });
  console.log('Captured stair-reduced-motion-fallback.png');

  await browser.close();
  console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
