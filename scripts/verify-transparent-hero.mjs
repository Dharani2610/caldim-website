import { chromium } from 'playwright';
import path from 'path';

async function main() {
  const artDir = "C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\8aaf8c42-8a67-4752-8950-eb47e2c6378e";
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-gl=angle',
      '--use-angle=d3d11',
      '--enable-webgl',
      '--enable-webgl2',
      '--enable-gpu-rasterization',
      '--ignore-gpu-blocklist',
      '--disable-gpu-sandbox'
    ]
  });

  // 1. Dark theme capture
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const heroSection = await page.locator('#top');
    await heroSection.screenshot({
      path: path.join(artDir, 'hero-transparent-dark.png')
    });
    console.log('Saved hero-transparent-dark.png');

    // Zoomed in on image edge in dark mode
    await page.screenshot({
      path: path.join(artDir, 'hero-edge-zoom-dark.png'),
      clip: { x: 750, y: 150, width: 600, height: 550 }
    });
    console.log('Saved hero-edge-zoom-dark.png');
    await page.close();
  }

  // 2. Light theme capture
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Toggle theme to light
    const themeBtn = await page.$('button[aria-label*="theme"], button[aria-label*="Theme"]');
    if (themeBtn) {
      await themeBtn.click();
      await page.waitForTimeout(1500);
    }

    const heroSection = await page.locator('#top');
    await heroSection.screenshot({
      path: path.join(artDir, 'hero-transparent-light.png')
    });
    console.log('Saved hero-transparent-light.png');

    // Zoomed in on image edge in light mode
    await page.screenshot({
      path: path.join(artDir, 'hero-edge-zoom-light.png'),
      clip: { x: 750, y: 150, width: 600, height: 550 }
    });
    console.log('Saved hero-edge-zoom-light.png');
    await page.close();
  }

  await browser.close();
}

main().catch(console.error);
