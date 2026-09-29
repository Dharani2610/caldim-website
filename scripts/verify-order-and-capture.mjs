import { chromium } from 'playwright';

async function verifyOrderAndCapture() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // 1. Verify DOM order in browser
  const domOrderResult = await page.evaluate(() => {
    const contact = document.getElementById('contact');
    const engineered = document.getElementById('engineered-across-borders');
    const network = document.getElementById('global-network');
    const footer = document.getElementById('site-footer');

    if (!contact || !engineered || !network || !footer) {
      return {
        success: false,
        elementsFound: {
          contact: !!contact,
          engineered: !!engineered,
          network: !!network,
          footer: !!footer
        }
      };
    }

    const allGlobalNetworkCount = document.querySelectorAll('#global-network').length;
    const allCorporateOfficesHeadings = Array.from(document.querySelectorAll('h2, h3'))
      .filter(el => el.textContent.includes('OUR CORPORATE OFFICES & LOCATIONS')).length;

    // Check that network is inside footer, and network comes AFTER the links grid (contains SERVICES)
    const linksGrid = Array.from(footer.querySelectorAll('div')).find(el => {
      return el.textContent.includes('SERVICES') && el.textContent.includes('STANDARDS') && el.textContent.includes('CONNECT');
    });

    const isNetworkInsideFooter = footer.contains(network);
    const posLinksToNetwork = linksGrid ? (linksGrid.compareDocumentPosition(network) & Node.DOCUMENT_POSITION_FOLLOWING) : false;

    return {
      success: !!(isNetworkInsideFooter && posLinksToNetwork),
      allGlobalNetworkCount,
      allCorporateOfficesHeadings,
      isNetworkInsideFooter,
      isNetworkAfterLinksGrid: !!posLinksToNetwork
    };
  });

  console.log('DOM Order Verification Result:', JSON.stringify(domOrderResult, null, 2));
  await page.close();

  // 2. Capture screenshots across breakpoints and themes
  const viewports = [
    { name: 'desktop', width: 1440, height: 1100 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 900 }
  ];

  const themes = ['dark', 'light'];

  for (const theme of themes) {
    for (const vp of viewports) {
      const p = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await p.goto('http://localhost:3000', { waitUntil: 'networkidle' });

      await p.evaluate((th) => {
        if (th === 'light') {
          document.documentElement.classList.add('light');
        } else {
          document.documentElement.classList.remove('light');
        }
      }, theme);

      await p.waitForTimeout(400);

      // Scroll so the links grid and corporate offices are both in view
      const netEl = await p.$('#global-network');
      if (netEl) {
        await netEl.scrollIntoViewIfNeeded();
        // scroll up slightly so the Services/Standards/Sitemap/Connect grid above it is visible
        await p.evaluate(() => {
          window.scrollBy(0, -320);
        });
        await p.waitForTimeout(500);
        await p.screenshot({ path: `scripts/footer-links-and-offices-${theme}-${vp.name}.png` });
        console.log(`Saved: scripts/footer-links-and-offices-${theme}-${vp.name}.png`);
      }

      await p.close();
    }
  }

  await browser.close();
  console.log('Verification & Screenshots complete!');
}

verifyOrderAndCapture().catch(console.error);
