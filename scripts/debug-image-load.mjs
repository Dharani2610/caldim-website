import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
  page.on('response', res => {
    if (res.url().includes('leadership') || res.status() >= 400) {
      console.log('RESPONSE:', res.status(), res.url());
    }
  });

  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
  await page.locator('#leadership').scrollIntoViewIfNeeded();
  await page.waitForTimeout(3000);
  await browser.close();
}

main().catch(console.error);
