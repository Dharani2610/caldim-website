import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
  
  const imgs = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('#leadership article'));
    return cards.map(c => {
      const name = c.querySelector('h3')?.innerText;
      const img = c.querySelector('img')?.src;
      return { name, img };
    });
  });
  console.log('Leadership Images rendered in page:', imgs);
  await browser.close();
}

main().catch(console.error);
