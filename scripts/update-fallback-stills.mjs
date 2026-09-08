import { chromium } from 'playwright';

async function updateFallbackImages() {
  const browser = await chromium.launch({ headless: true });

  // 1. Dark Theme Completed Canvas Still
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(11500);

    const canvas = await page.$('canvas');
    if (canvas) {
      await canvas.screenshot({ path: 'public/images/hero-glow-frame.png' });
      console.log('Updated public/images/hero-glow-frame.png');
    }
    await page.close();
  }

  // 2. Light Theme Completed Canvas Still
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    // Toggle to light mode
    const themeBtn = await page.$('button[aria-label*="theme"], button:has(.lucide-sun), button:has(.lucide-moon)');
    if (themeBtn) {
      await themeBtn.click();
      await page.waitForTimeout(1000);
    }
    await page.waitForTimeout(11500);
    const canvas = await page.$('canvas');
    if (canvas) {
      await canvas.screenshot({ path: 'public/images/hero-glow-frame-light.png' });
      console.log('Updated public/images/hero-glow-frame-light.png');
    }
    await page.close();
  }

  await browser.close();
}

updateFallbackImages().catch(console.error);
