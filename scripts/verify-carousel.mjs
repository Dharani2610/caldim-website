import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/USER/.gemini/antigravity-ide/brain/1ae4a55b-f1a8-44f9-b4cc-4c90ed7e5fff';

async function main() {
  const browser = await chromium.launch();
  
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' });
  
  // Scroll to projects
  await page.evaluate(() => {
    document.getElementById('projects')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(1000);

  // 1. Initial State: Center / Default
  const projectViewer = page.locator('#projects article').first().locator('[role="region"]');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'carousel-1-center-default.png'),
    clip: await projectViewer.boundingBox()
  });
  console.log('Captured carousel-1-center-default.png');

  // 2. Click Left Arrow -> Erected View
  const leftArrow = projectViewer.locator('button[aria-label="View erected construction steel"]');
  await leftArrow.click();
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'carousel-2-left-erected.png'),
    clip: await projectViewer.boundingBox()
  });
  console.log('Captured carousel-2-left-erected.png');

  // 3. Click Right Arrow -> Model View
  const rightArrow = projectViewer.locator('button[aria-label="View completed architectural model"]');
  await rightArrow.click();
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'carousel-3-right-model.png'),
    clip: await projectViewer.boundingBox()
  });
  console.log('Captured carousel-3-right-model.png');

  // 4. Click Center button -> Back to wireframe
  const centerBtn = projectViewer.locator('button:has-text("WIREFRAME")');
  await centerBtn.click();
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'carousel-4-center-restored.png'),
    clip: await projectViewer.boundingBox()
  });
  console.log('Captured carousel-4-center-restored.png');

  // 5. Full Projects Section View
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'projects-section-overview.png')
  });
  console.log('Captured projects-section-overview.png');

  await browser.close();
  console.log('Verification completed successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
