import { chromium } from 'playwright';

async function checkFonts() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const fontRequests = [];
  page.on('response', (res) => {
    if (res.request().resourceType() === 'font' || res.url().includes('.woff2')) {
      fontRequests.push({ url: res.url(), status: res.status() });
    }
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  console.log('Font Network Requests:');
  console.log(JSON.stringify(fontRequests, null, 2));

  const navStyles = await page.evaluate(() => {
    const navLink = document.querySelector('nav a[href="#services"]');
    const ctaButton = document.querySelector('nav a[href="#contact"]');
    const brandTitle = document.querySelector('nav a[href="#top"] span');

    return {
      navLink: {
        text: navLink?.innerText,
        fontFamily: navLink ? window.getComputedStyle(navLink).fontFamily : null,
        fontSize: navLink ? window.getComputedStyle(navLink).fontSize : null,
        letterSpacing: navLink ? window.getComputedStyle(navLink).letterSpacing : null,
      },
      ctaButton: {
        text: ctaButton?.innerText,
        fontFamily: ctaButton ? window.getComputedStyle(ctaButton).fontFamily : null,
        fontSize: ctaButton ? window.getComputedStyle(ctaButton).fontSize : null,
      },
      brandTitle: {
        text: brandTitle?.innerText,
        fontFamily: brandTitle ? window.getComputedStyle(brandTitle).fontFamily : null,
      }
    };
  });

  console.log('Computed Styles:', JSON.stringify(navStyles, null, 2));

  await browser.close();
}

checkFonts().catch(console.error);
