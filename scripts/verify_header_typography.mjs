import { chromium } from 'playwright';
import path from 'path';

const outDir = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\81792036-f14b-4fe2-824b-4f6c20cf6fba';

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Evaluate computed styles
  const styles = await page.evaluate(() => {
    const navLink = document.querySelector('nav a[href="#services"]');
    const ctaButton = document.querySelector('nav a[href="#contact"]');
    const brandTitle = document.querySelector('nav a[href="#top"] span');
    const techEyebrow = document.querySelector('.label-mono-sm, .label-mono');

    return {
      navLink: {
        text: navLink?.innerText,
        fontFamily: navLink ? window.getComputedStyle(navLink).fontFamily : null,
        fontSize: navLink ? window.getComputedStyle(navLink).fontSize : null,
        fontWeight: navLink ? window.getComputedStyle(navLink).fontWeight : null,
      },
      ctaButton: {
        text: ctaButton?.innerText,
        fontFamily: ctaButton ? window.getComputedStyle(ctaButton).fontFamily : null,
        fontSize: ctaButton ? window.getComputedStyle(ctaButton).fontSize : null,
        fontWeight: ctaButton ? window.getComputedStyle(ctaButton).fontWeight : null,
      },
      brandTitle: {
        text: brandTitle?.innerText,
        fontFamily: brandTitle ? window.getComputedStyle(brandTitle).fontFamily : null,
      },
      techEyebrow: {
        text: techEyebrow?.innerText,
        fontFamily: techEyebrow ? window.getComputedStyle(techEyebrow).fontFamily : null,
      }
    };
  });

  console.log('Computed typography verification:', JSON.stringify(styles, null, 2));

  // Screenshot of desktop header
  const headerElem = await page.$('header');
  if (headerElem) {
    await headerElem.screenshot({ path: path.join(outDir, 'header-fixed-desktop.png') });
    console.log('Captured header-fixed-desktop.png');
  }

  // Full top viewport screenshot
  await page.screenshot({
    path: path.join(outDir, 'header-hero-desktop.png'),
    clip: { x: 0, y: 0, width: 1440, height: 280 }
  });

  // Mobile Viewport at 375px
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(300);

  // Open mobile menu
  const menuBtn = await page.$('button[aria-label="Open menu"]');
  if (menuBtn) {
    await menuBtn.click();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(outDir, 'header-fixed-mobile-open.png'),
      clip: { x: 0, y: 0, width: 375, height: 600 }
    });
    console.log('Captured header-fixed-mobile-open.png');
  }

  await browser.close();
  console.log('Verification completed.');
}

verify().catch(console.error);
