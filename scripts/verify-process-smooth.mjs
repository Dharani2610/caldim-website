import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  let port = 3000;
  try {
    await page.goto('http://localhost:3000/#process', { waitUntil: 'domcontentloaded', timeout: 4000 });
  } catch (e) {
    port = 3001;
    await page.goto('http://localhost:3001/#process', { waitUntil: 'domcontentloaded', timeout: 4000 });
  }
  console.log(`Connected to port ${port}`);

  await page.waitForTimeout(500);
  const processSection = await page.$('#process');
  if (processSection) {
    // Capture at ~1 second (filling 01 -> 02)
    await page.waitForTimeout(1000);
    await processSection.screenshot({ path: 'scripts/process-frame-1s.png' });
    console.log('Captured frame at ~1s (01 -> 02)');

    // Capture at ~3.8 seconds (reached 02, filling 02 -> 03)
    await page.waitForTimeout(2800);
    await processSection.screenshot({ path: 'scripts/process-frame-4s.png' });
    console.log('Captured frame at ~3.8s (02 -> 03)');
  }
  
  await browser.close();
}

main().catch(console.error);
