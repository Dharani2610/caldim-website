import { chromium } from 'playwright';

async function generateCleanFallbackStills() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--enable-gpu-rasterization', '--ignore-gpu-blocklist']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  console.log('Waiting for 3D model to assemble...');
  await page.waitForTimeout(10000);

  // Remove header and hero text DOM overlays to capture pure 3D canvas
  await page.evaluate(() => {
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';
    const textOverlay = document.querySelector('#intro > div.relative.z-10');
    if (textOverlay) textOverlay.style.display = 'none';
  });

  await page.waitForTimeout(500);

  // 1. Light theme pure 3D canvas still
  const canvas = await page.locator('#intro canvas');
  await canvas.screenshot({ path: 'public/images/hero-glow-frame-light.png' });
  console.log('Cleanly updated public/images/hero-glow-frame-light.png');

  // 2. Dark theme pure 3D canvas still
  const themeBtn = await page.locator('button[aria-label*="theme"], button:has(.lucide-sun), button:has(.lucide-moon)').first();
  if (await themeBtn.count() > 0) {
    await themeBtn.click();
    await page.waitForTimeout(1000);
    await canvas.screenshot({ path: 'public/images/hero-glow-frame.png' });
    console.log('Cleanly updated public/images/hero-glow-frame.png');
  }

  await browser.close();
  console.log('Fallback stills fixed successfully!');
}

generateCleanFallbackStills().catch(console.error);
