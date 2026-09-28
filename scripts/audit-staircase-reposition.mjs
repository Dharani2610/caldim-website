import { chromium } from 'playwright';

async function audit() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--enable-gpu-rasterization', '--ignore-gpu-blocklist']
  });

  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 812 }
  ];

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    console.log(`[${vp.name}] Width: ${vp.width}px, Horizontal Overflow: ${hasOverflow ? 'FAIL (overflow detected)' : 'PASS (no overflow)'}`);
    await page.close();
  }

  // Check reduced motion
  const reducedMotionPage = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });
  await reducedMotionPage.emulateMedia({ reducedMotion: 'reduce' });
  await reducedMotionPage.goto('http://localhost:3001', { waitUntil: 'networkidle' });
  await reducedMotionPage.waitForTimeout(2000);

  const isFallbackImagePresent = await reducedMotionPage.evaluate(() => {
    const img = document.querySelector('#intro img');
    return !!img && img.getAttribute('src')?.includes('hero-glow-frame');
  });
  console.log(`[Reduced Motion] Fallback Image Loaded: ${isFallbackImagePresent ? 'PASS' : 'FAIL'}`);
  await reducedMotionPage.close();

  await browser.close();
}

audit().catch(console.error);
