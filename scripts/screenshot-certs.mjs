import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const certsSection = await page.$('section[aria-labelledby="certs-heading"]');
  if (certsSection) {
    // 1. Dark mode
    await page.evaluate(() => {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    });
    await page.waitForTimeout(500);
    await certsSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await certsSection.screenshot({
      path: 'C:/Users/USER/.gemini/antigravity-ide/brain/8aaf8c42-8a67-4752-8950-eb47e2c6378e/certifications_dark.png'
    });
    console.log('Saved certifications_dark.png');

    // 2. Light mode
    await page.evaluate(() => {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    });
    await page.waitForTimeout(500);
    await certsSection.screenshot({
      path: 'C:/Users/USER/.gemini/antigravity-ide/brain/8aaf8c42-8a67-4752-8950-eb47e2c6378e/certifications_light.png'
    });
    console.log('Saved certifications_light.png');
  }

  await browser.close();
}

main().catch(console.error);
