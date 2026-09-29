import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  
  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { timeout: 45000, waitUntil: 'domcontentloaded' });
  console.log('Connected!');
  
  const section = page.locator('section[aria-labelledby="certs-heading"]');
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(2000);
  await section.screenshot({ path: 'scripts/cert-section-verified.png' });
  console.log('✅ Screenshot saved to scripts/cert-section-verified.png');
  
  await browser.close();
}

main().catch(console.error);
