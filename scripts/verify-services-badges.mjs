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
    viewport: { width: 1440, height: 1200 }
  });

  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  console.log('--- 1. Capturing Desktop (1440px) ---');
  await page.evaluate(() => {
    const el = document.querySelector('#services');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(1000);

  const servicesDesktop = await page.$('#services');
  const desktopPath = path.join(artifactDir, 'services-desktop-1440.png');
  if (servicesDesktop) {
    await servicesDesktop.screenshot({ path: desktopPath });
    console.log(`Saved desktop screenshot: ${desktopPath}`);
  }

  const serviceCards = await page.evaluate(() => {
    const section = document.querySelector('#services');
    if (!section) return { found: false, count: 0, cards: [] };
    const headings = Array.from(section.querySelectorAll('h3')).map(h => h.textContent.trim());
    const standards = Array.from(section.querySelectorAll('.label-mono-sm')).map(el => el.textContent.trim());
    const learnMoreLinks = Array.from(section.querySelectorAll('button')).map(b => b.textContent.trim());
    return {
      found: true,
      cardCount: headings.length,
      headings,
      standards,
      learnMoreLinks
    };
  });
  console.log('Desktop #services info:', JSON.stringify(serviceCards));

  console.log('\n--- 2. Capturing Mobile (375px) ---');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const el = document.querySelector('#services');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(1000);

  const servicesMobile = await page.$('#services');
  const mobilePath = path.join(artifactDir, 'services-mobile-375.png');
  if (servicesMobile) {
    await servicesMobile.screenshot({ path: mobilePath });
    console.log(`Saved mobile screenshot: ${mobilePath}`);
  }

  console.log('\n--- 3. Checking Horizontal Overflow across viewports ---');
  const viewports = [320, 375, 414, 768, 1024, 1280, 1440];
  for (const w of viewports) {
    await page.setViewportSize({ width: w, height: 800 });
    await page.waitForTimeout(200);
    const overflow = await page.evaluate(() => {
      const section = document.querySelector('#services');
      return {
        docScrollWidth: document.documentElement.scrollWidth,
        docClientWidth: document.documentElement.clientWidth,
        docHasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        sectionScrollWidth: section ? section.scrollWidth : null,
        sectionClientWidth: section ? section.clientWidth : null,
        sectionHasOverflow: section ? section.scrollWidth > section.clientWidth : null
      };
    });
    console.log(`Viewport ${w}px:`, JSON.stringify(overflow));
  }

  await page.close();
  await browser.close();
  console.log('\nVerification completed successfully.');
}

main().catch(console.error);
