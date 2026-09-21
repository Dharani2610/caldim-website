import { chromium } from 'playwright';
import path from 'path';

async function main() {
  const artDir = "C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\fa3be403-bf0f-444a-bc1d-579557b8bbe0";
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });

  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
  
  // Scroll to leadership section
  const leadership = page.locator('#leadership');
  await leadership.scrollIntoViewIfNeeded();
  // Wait for entrance transition (900ms + index * 110ms + image render)
  await page.waitForTimeout(3000);

  await leadership.screenshot({
    path: path.join(artDir, 'leadership-section-new-verified.png')
  });
  console.log('Saved leadership-section-new-verified.png');

  await browser.close();
}

main().catch(console.error);
