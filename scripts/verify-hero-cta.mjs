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
  await page.waitForTimeout(1500);

  console.log('--- 1. Capturing Desktop (1440x900) ---');
  await page.evaluate(() => {
    const el = document.querySelector('#top');
    if (el) el.scrollIntoView();
  });
  await page.waitForTimeout(500);

  const heroTopDesktop = await page.$('#top');
  const desktopPath = path.join(artifactDir, 'hero-desktop-1440.png');
  if (heroTopDesktop) {
    await heroTopDesktop.screenshot({ path: desktopPath });
    console.log(`Saved desktop screenshot: ${desktopPath}`);
  }

  const desktopButtons = await page.evaluate(() => {
    const top = document.querySelector('#top');
    if (!top) return { found: false, count: 0, texts: [] };
    const links = Array.from(top.querySelectorAll('a, button'));
    return {
      found: true,
      count: links.length,
      texts: links.map(el => el.textContent.trim())
    };
  });
  console.log('Desktop #top buttons/links:', JSON.stringify(desktopButtons));

  console.log('\n--- 2. Capturing Mobile (375x812) ---');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const el = document.querySelector('#top');
    if (el) el.scrollIntoView();
  });
  await page.waitForTimeout(500);

  const heroTopMobile = await page.$('#top');
  const mobilePath = path.join(artifactDir, 'hero-mobile-375.png');
  if (heroTopMobile) {
    await heroTopMobile.screenshot({ path: mobilePath });
    console.log(`Saved mobile screenshot: ${mobilePath}`);
  }

  const mobileButtons = await page.evaluate(() => {
    const top = document.querySelector('#top');
    if (!top) return { found: false, count: 0, texts: [] };
    const links = Array.from(top.querySelectorAll('a, button'));
    return {
      found: true,
      count: links.length,
      texts: links.map(el => el.textContent.trim())
    };
  });
  console.log('Mobile #top buttons/links:', JSON.stringify(mobileButtons));

  console.log('\n--- 3. Checking Horizontal Overflow across viewports ---');
  const viewports = [320, 375, 414, 768, 1024, 1280, 1440];
  for (const w of viewports) {
    await page.setViewportSize({ width: w, height: 800 });
    await page.waitForTimeout(200);
    const overflow = await page.evaluate(() => {
      const top = document.querySelector('#top');
      return {
        docScrollWidth: document.documentElement.scrollWidth,
        docClientWidth: document.documentElement.clientWidth,
        docHasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        topScrollWidth: top ? top.scrollWidth : null,
        topClientWidth: top ? top.clientWidth : null,
        topHasOverflow: top ? top.scrollWidth > top.clientWidth : null
      };
    });
    console.log(`Viewport ${w}px:`, JSON.stringify(overflow));
  }

  console.log('\n--- 4. Checking Site-wide Header Request Quote CTA ---');
  const navCtaExists = await page.evaluate(() => {
    const allLinks = Array.from(document.querySelectorAll('a, button'));
    const quoteButtons = allLinks.filter(el => el.textContent.includes('Request Quote'));
    return {
      quoteButtonsCount: quoteButtons.length,
      quoteButtonsText: quoteButtons.map(b => b.textContent.trim())
    };
  });
  console.log('Site-wide Request Quote buttons:', JSON.stringify(navCtaExists));

  await page.close();
  await browser.close();
  console.log('\nVerification completed successfully.');
}

main().catch(console.error);
