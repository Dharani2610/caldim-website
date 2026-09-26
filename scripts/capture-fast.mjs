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
  
  // Scroll to services top
  await page.evaluate(() => {
    document.getElementById('services')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(1000);

  // Row 1 (Cards 1 & 2)
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'services-desktop-row-1.png')
  });
  console.log('Captured services-desktop-row-1.png');

  // Scroll to Row 2 (Cards 3 & 4)
  await page.evaluate(() => {
    window.scrollBy(0, 500);
  });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'services-desktop-row-2.png')
  });
  console.log('Captured services-desktop-row-2.png');

  // Scroll to Row 3 (Cards 5 & 6)
  await page.evaluate(() => {
    window.scrollBy(0, 500);
  });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'services-desktop-row-3.png')
  });
  console.log('Captured services-desktop-row-3.png');

  // 2. Mobile Viewport (390x844)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' });
  await mobilePage.evaluate(() => {
    document.getElementById('services')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await mobilePage.waitForTimeout(1000);

  await mobilePage.screenshot({
    path: path.join(ARTIFACT_DIR, 'services-mobile-1col.png')
  });
  console.log('Captured services-mobile-1col.png');

  await browser.close();
  console.log('ALL SCREENSHOTS CAPTURED SUCCESSFULLY!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
