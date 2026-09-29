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
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
  
  // Scroll down to services and through all cards to trigger InView
  await page.evaluate(async () => {
    const sec = document.getElementById('services');
    if (!sec) return;
    sec.scrollIntoView({ behavior: 'instant', block: 'start' });
    // Scroll through the section to trigger all observers
    const top = sec.offsetTop;
    const height = sec.offsetHeight;
    window.scrollTo({ top: top + height / 3, behavior: 'instant' });
    await new Promise(r => setTimeout(r, 400));
    window.scrollTo({ top: top + (height * 2) / 3, behavior: 'instant' });
    await new Promise(r => setTimeout(r, 400));
    window.scrollTo({ top: top + height, behavior: 'instant' });
    await new Promise(r => setTimeout(r, 400));
    window.scrollTo({ top: top, behavior: 'instant' });
  });
  await page.waitForTimeout(1500);

  const servicesSection = page.locator('#services');
  await servicesSection.screenshot({
    path: path.join(ARTIFACT_DIR, 'services-desktop-all-cards.png')
  });
  console.log('Captured services-desktop-all-cards.png');

  // Hover on Card 2 (Structural Steel Detailing)
  const cards = servicesSection.locator('.group');
  const card2 = cards.nth(1);
  await card2.hover();
  await page.waitForTimeout(600);
  await card2.screenshot({
    path: path.join(ARTIFACT_DIR, 'card-02-structural-featured.png')
  });
  console.log('Captured card-02-structural-featured.png');

  // Hover and capture other cards
  for (let i = 0; i < 6; i++) {
    await cards.nth(i).screenshot({
      path: path.join(ARTIFACT_DIR, `card-0${i + 1}-discipline.png`)
    });
  }
  console.log('Captured all 6 individual card screenshots!');

  // Click Learn more on Card 1 (Estimation)
  const learnMoreBtn = cards.nth(0).locator('button', { hasText: 'Learn more' });
  await learnMoreBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'services-deliverables-modal.png')
  });
  console.log('Captured services-deliverables-modal.png');

  // Close modal
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // 2. Mobile Viewport (390x844)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3001', { waitUntil: 'networkidle' });
  await mobilePage.evaluate(async () => {
    const sec = document.getElementById('services');
    if (!sec) return;
    sec.scrollIntoView({ behavior: 'instant', block: 'start' });
    const top = sec.offsetTop;
    const height = sec.offsetHeight;
    for (let p = 0; p <= height; p += 400) {
      window.scrollTo({ top: top + p, behavior: 'instant' });
      await new Promise(r => setTimeout(r, 200));
    }
    window.scrollTo({ top: top, behavior: 'instant' });
  });
  await mobilePage.waitForTimeout(1500);

  const mobileServices = mobilePage.locator('#services');
  await mobileServices.screenshot({
    path: path.join(ARTIFACT_DIR, 'services-mobile-1col.png')
  });
  console.log('Captured services-mobile-1col.png');

  await browser.close();
  console.log('All verifications completed successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
