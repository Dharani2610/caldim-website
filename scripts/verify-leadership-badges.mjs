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

  console.log('--- 1. Capturing Desktop (1440x900) ---');
  await page.evaluate(() => {
    const el = document.querySelector('#leadership');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  // Wait for intersection observer animation to settle
  await page.waitForTimeout(1500);

  const leaderDesktop = await page.$('#leadership');
  const desktopPath = path.join(artifactDir, 'leadership-desktop-1440.png');
  if (leaderDesktop) {
    await leaderDesktop.screenshot({ path: desktopPath });
    console.log(`Saved desktop screenshot: ${desktopPath}`);
  }

  const leaderCards = await page.evaluate(() => {
    const section = document.querySelector('#leadership');
    if (!section) return { found: false, count: 0, names: [], badges: [] };
    const articles = Array.from(section.querySelectorAll('article'));
    const names = Array.from(section.querySelectorAll('h3')).map(h => h.textContent.trim());
    // Check if any part-mark / numbered bubble remains (e.g. text like "01", "02", "03", "04" in absolute spans)
    const numbers = Array.from(section.querySelectorAll('.label-mono-sm')).map(el => el.textContent.trim());
    return {
      found: true,
      cardCount: articles.length,
      names,
      numbers
    };
  });
  console.log('Desktop #leadership info:', JSON.stringify(leaderCards));

  console.log('\n--- 2. Capturing Mobile (375x812) ---');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const el = document.querySelector('#leadership');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(1500);

  const leaderMobile = await page.$('#leadership');
  const mobilePath = path.join(artifactDir, 'leadership-mobile-375.png');
  if (leaderMobile) {
    await leaderMobile.screenshot({ path: mobilePath });
    console.log(`Saved mobile screenshot: ${mobilePath}`);
  }

  console.log('\n--- 3. Checking Horizontal Overflow across viewports ---');
  const viewports = [320, 375, 414, 768, 1024, 1280, 1440];
  for (const w of viewports) {
    await page.setViewportSize({ width: w, height: 800 });
    await page.waitForTimeout(200);
    const overflow = await page.evaluate(() => {
      const section = document.querySelector('#leadership');
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
