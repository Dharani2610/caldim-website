import { chromium } from 'playwright';

async function verifyOffices() {
  console.log('=== STARTING OFFICES & GLOBAL PRESENCE VERIFICATION ===');
  const browser = await chromium.launch();

  // Test across resolutions & themes
  const viewports = [
    { name: 'desktop', width: 1440, height: 1200 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 812 }
  ];

  const themes = ['dark', 'light'];

  for (const theme of themes) {
    for (const vp of viewports) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

      // Apply theme
      await page.evaluate((th) => {
        if (th === 'light') {
          document.documentElement.classList.add('light');
        } else {
          document.documentElement.classList.remove('light');
        }
      }, theme);
      await page.waitForTimeout(400);

      // Check overflow
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      console.log(`[${theme.toUpperCase()} - ${vp.name.toUpperCase()}] Horizontal overflow: ${overflow ? 'FAIL (Overflow detected)' : 'PASS (No overflow)'}`);

      // Capture Contact Global Presence Section
      const globalPresenceEl = await page.$('#global-presence');
      if (globalPresenceEl) {
        await globalPresenceEl.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await globalPresenceEl.screenshot({ path: `scripts/global-presence-${theme}-${vp.name}.png` });
        console.log(`Saved screenshot: scripts/global-presence-${theme}-${vp.name}.png`);
      }

      // Capture Footer Corporate Offices Section
      const footerEl = await page.$('#site-footer');
      if (footerEl) {
        await footerEl.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await footerEl.screenshot({ path: `scripts/footer-${theme}-${vp.name}.png` });
        console.log(`Saved screenshot: scripts/footer-${theme}-${vp.name}.png`);
      }

      await page.close();
    }
  }

  // Check functional elements: tel links, copy, India offices preservation
  const testPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await testPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  const contactChecks = await testPage.evaluate(() => {
    const contactSection = document.getElementById('contact');
    if (!contactSection) return { error: 'Contact section not found' };

    // Check India offices preserved
    const hosurPresent = contactSection.innerText.includes('Registered Office — Hosur') || contactSection.innerText.includes('Hosur');
    const chennaiPresent = contactSection.innerText.includes('Corporate Office — Chennai') || contactSection.innerText.includes('Chennai');

    // Check USA Office panel
    const usaTitlePresent = contactSection.innerText.includes('USA — INTERNATIONAL OFFICE');
    const usaEntityPresent = contactSection.innerText.includes('Caldim Tech Services LLC');
    const usaAddressPresent = contactSection.innerText.includes('8668 John Hickman Pkwy, Suite 903, Frisco, Texas 75034, USA');
    const usaHeadingPresent = contactSection.innerText.includes('Engineering Beyond Borders.');
    
    // Check tel link in Contact USA Panel
    const usaTelLink = Array.from(contactSection.querySelectorAll('a')).find(a => a.href.includes('tel:'));
    const usaTelHref = usaTelLink ? usaTelLink.getAttribute('href') : null;
    const usaTelText = usaTelLink ? usaTelLink.innerText.trim() : null;

    // Check Footer Corporate Offices
    const footer = document.getElementById('site-footer');
    const footerUsaTel = footer ? Array.from(footer.querySelectorAll('a')).find(a => a.href === 'tel:+12484553855') : null;

    return {
      hosurPresent,
      chennaiPresent,
      usaTitlePresent,
      usaEntityPresent,
      usaAddressPresent,
      usaHeadingPresent,
      usaTelHref,
      usaTelText,
      footerUsaTelHref: footerUsaTel ? footerUsaTel.getAttribute('href') : null,
    };
  });

  console.log('\n--- VERIFICATION CHECKS RESULT ---');
  console.log(JSON.stringify(contactChecks, null, 2));

  // Reduced motion test
  const reducedMotionPage = await browser.newPage({ 
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce'
  });
  await reducedMotionPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  const reducedMotionActive = await reducedMotionPage.evaluate(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  console.log('\nReduced motion media query active in browser:', reducedMotionActive);

  await browser.close();
  console.log('\n=== ALL VERIFICATIONS COMPLETED ===');
}

verifyOffices().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});
