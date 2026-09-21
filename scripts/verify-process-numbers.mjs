import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function main() {
  const artifactDir = "C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\b5684500-bd19-40c4-8728-022e22fe6c26";
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist']
  });

  const baseUrl = 'http://localhost:3001';
  console.log(`Using base URL: ${baseUrl}`);

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  console.log('--- 1. Capturing Desktop (1440px) ---');
  await page.evaluate(() => {
    const el = document.querySelector('#process');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(1500);

  const processDesktop = await page.$('#process');
  const desktopPath = path.join(artifactDir, 'process-desktop-1440.png');
  if (processDesktop) {
    await processDesktop.screenshot({ path: desktopPath });
    console.log(`Saved desktop screenshot: ${desktopPath}`);
  }

  const processCards = await page.evaluate(() => {
    const section = document.querySelector('#process');
    if (!section) return { found: false, count: 0, cards: [] };
    const headings = Array.from(section.querySelectorAll('h3')).map(h => h.textContent.trim());
    const phases = Array.from(section.querySelectorAll('.label-mono-sm')).map(el => el.textContent.trim());
    return {
      found: true,
      cardCount: headings.length,
      headings,
      phases
    };
  });
  console.log('Desktop #process info:', JSON.stringify(processCards));

  console.log('\n--- 2. Capturing Mobile (375px) ---');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const el = document.querySelector('#process');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(1500);

  const processMobile = await page.$('#process');
  const mobilePath = path.join(artifactDir, 'process-mobile-375.png');
  if (processMobile) {
    await processMobile.screenshot({ path: mobilePath });
    console.log(`Saved mobile screenshot: ${mobilePath}`);
  }

  await page.close();
  await browser.close();
  console.log('\nVerification completed successfully.');
}

main().catch(console.error);
