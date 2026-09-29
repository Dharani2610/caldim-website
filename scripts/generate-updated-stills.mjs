import { chromium } from 'playwright';

async function generateCleanFallbackStills() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--enable-gpu-rasterization', '--ignore-gpu-blocklist']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
  console.log('Waiting for 3D model to assemble...');
  await page.waitForTimeout(10500);

  // Remove header and hero text DOM overlays to capture pure 3D canvas
  await page.evaluate(() => {
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';
    const textOverlay = document.querySelector('#intro > div.relative.z-10');
    if (textOverlay) textOverlay.style.display = 'none';
  });

  await page.waitForTimeout(500);

  const canvas = await page.locator('#intro canvas');
  await canvas.screenshot({ path: 'frontend/public/images/hero-glow-frame-light.png' });
  console.log('Cleanly updated frontend/public/images/hero-glow-frame-light.png');

  // Also update public/ if it exists at root
  try {
    await canvas.screenshot({ path: 'public/images/hero-glow-frame-light.png' });
  } catch (_) {}

  // 2. Dark theme pure 3D canvas still
  // Toggle theme
  await page.evaluate(() => {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  });
  await page.waitForTimeout(1000);
  await canvas.screenshot({ path: 'frontend/public/images/hero-glow-frame.png' });
  console.log('Cleanly updated frontend/public/images/hero-glow-frame.png');
  try {
    await canvas.screenshot({ path: 'public/images/hero-glow-frame.png' });
  } catch (_) {}

  await browser.close();
  console.log('Fallback stills fixed successfully!');
}

generateCleanFallbackStills().catch(console.error);
