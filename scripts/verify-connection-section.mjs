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
    const el = document.querySelector('#connections');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(1000);

  const connDesktop = await page.$('#connections');
  const desktopPath = path.join(artifactDir, 'connections-desktop-1440.png');
  if (connDesktop) {
    await connDesktop.screenshot({ path: desktopPath });
    console.log(`Saved desktop screenshot: ${desktopPath}`);
  }

  const desktopButtons = await page.evaluate(() => {
    const section = document.querySelector('#connections');
    if (!section) return { found: false, buttons: [] };
    const linksAndBtns = Array.from(section.querySelectorAll('a, button'));
    return {
      found: true,
      count: linksAndBtns.length,
      texts: linksAndBtns.map(el => el.textContent.trim())
    };
  });
  console.log('Desktop #connections buttons/links:', JSON.stringify(desktopButtons));

  console.log('\n--- 2. Capturing Mobile (375x812) ---');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const el = document.querySelector('#connections');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(1000);

  const connMobile = await page.$('#connections');
  const mobilePath = path.join(artifactDir, 'connections-mobile-375.png');
  if (connMobile) {
    await connMobile.screenshot({ path: mobilePath });
    console.log(`Saved mobile screenshot: ${mobilePath}`);
  }

  const mobileButtons = await page.evaluate(() => {
    const section = document.querySelector('#connections');
    if (!section) return { found: false, buttons: [] };
    const linksAndBtns = Array.from(section.querySelectorAll('a, button'));
    return {
      found: true,
      count: linksAndBtns.length,
      texts: linksAndBtns.map(el => el.textContent.trim())
    };
  });
  console.log('Mobile #connections buttons/links:', JSON.stringify(mobileButtons));

  console.log('\n--- 3. Checking Horizontal Overflow across viewports ---');
  const viewports = [320, 375, 414, 768, 1024, 1280, 1440];
  for (const w of viewports) {
    await page.setViewportSize({ width: w, height: 800 });
    await page.waitForTimeout(200);
    const overflow = await page.evaluate(() => {
      const section = document.querySelector('#connections');
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

  // Check site-wide CTAs
  console.log('\n--- 4. Checking Site-wide Request Quote CTAs ---');
  const siteCtas = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('a, button'));
    return all
      .filter(el => /quote|contact/i.test(el.textContent || ''))
      .map(el => ({ text: el.textContent.trim(), tag: el.tagName, href: el.getAttribute('href') }));
  });
  console.log('Site-wide Quote/Contact CTAs:', JSON.stringify(siteCtas));

  await page.close();
  await browser.close();
  console.log('\nVerification completed successfully.');
}

main().catch(console.error);
