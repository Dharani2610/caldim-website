import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  
  // Test both Dark mode and Light mode
  for (const theme of ['dark', 'light']) {
    const page = await browser.newPage({ 
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce' // Ensures immediate static layout without 3D entry delays
    });

    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Set theme class on html element
    await page.evaluate((t) => {
      if (t === 'light') {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    }, theme);

    await page.locator('#leadership').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Full section default screenshot
    await page.locator('#leadership').screenshot({ path: `scripts/leadership-section-${theme}-default.png` });

    const cards = await page.$$('#leadership [tabindex="0"]');
    const cardMeasurements = [];

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];

      // Measure unhovered
      await page.mouse.move(0, 0);
      await page.waitForTimeout(200);

      const defBox = await card.boundingBox();
      const h3Name = await card.$eval('h3', el => el.innerText.trim());

      // Default screenshot
      await page.screenshot({
        path: `scripts/card-${i + 1}-${theme}-default.png`,
        clip: {
          x: Math.round(defBox.x),
          y: Math.round(defBox.y),
          width: Math.round(defBox.width),
          height: Math.round(defBox.height)
        }
      });

      // Hover
      await page.mouse.move(defBox.x + defBox.width / 2, defBox.y + defBox.height / 2);
      await page.waitForTimeout(300);

      const hovBox = await card.boundingBox();

      // Check inner scroll details
      const scrollInfo = await card.evaluate((el) => {
        const scrollable = el.querySelector('.overflow-y-auto');
        return {
          scrollHeight: scrollable ? scrollable.scrollHeight : 0,
          clientHeight: scrollable ? scrollable.clientHeight : 0,
          isScrollable: scrollable ? scrollable.scrollHeight > scrollable.clientHeight : false
        };
      });

      // Revealed screenshot
      await page.screenshot({
        path: `scripts/card-${i + 1}-${theme}-revealed.png`,
        clip: {
          x: Math.round(hovBox.x),
          y: Math.round(hovBox.y),
          width: Math.round(hovBox.width),
          height: Math.round(hovBox.height)
        }
      });

      cardMeasurements.push({
        leader: h3Name,
        defaultWidth: defBox.width,
        defaultHeight: defBox.height,
        hoveredWidth: hovBox.width,
        hoveredHeight: hovBox.height,
        widthDiff: Math.abs(hovBox.width - defBox.width),
        heightDiff: Math.abs(hovBox.height - defBox.height),
        ...scrollInfo
      });
    }

    console.log(`\n=== Theme: ${theme.toUpperCase()} (1440px Desktop) ===`);
    console.table(cardMeasurements.map(m => ({
      Leader: m.leader,
      'Default (WxH)': `${m.defaultWidth.toFixed(1)} x ${m.defaultHeight.toFixed(1)}`,
      'Hovered (WxH)': `${m.hoveredWidth.toFixed(1)} x ${m.hoveredHeight.toFixed(1)}`,
      'Δ Width': m.widthDiff.toFixed(2),
      'Δ Height': m.heightDiff.toFixed(2),
      'Scroll Needed': m.isScrollable,
      'Scroll / Client H': `${m.scrollHeight} / ${m.clientHeight}`
    })));

    await page.close();
  }

  // Mobile Touch test (375px)
  const mobilePage = await browser.newPage({ 
    viewport: { width: 375, height: 812 },
    reducedMotion: 'reduce'
  });
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await mobilePage.locator('#leadership').scrollIntoViewIfNeeded();
  await mobilePage.waitForTimeout(500);

  const mobCard = await mobilePage.$('#leadership [tabindex="0"]');
  const mobDef = await mobCard.boundingBox();

  await mobilePage.screenshot({
    path: `scripts/card-mobile-default.png`,
    clip: {
      x: Math.round(mobDef.x),
      y: Math.round(mobDef.y),
      width: Math.round(mobDef.width),
      height: Math.round(mobDef.height)
    }
  });

  // Tap to reveal
  await mobCard.evaluate(el => el.click());
  await mobilePage.waitForTimeout(300);

  const mobHov = await mobCard.boundingBox();
  await mobilePage.screenshot({
    path: `scripts/card-mobile-revealed.png`,
    clip: {
      x: Math.round(mobHov.x),
      y: Math.round(mobHov.y),
      width: Math.round(mobHov.width),
      height: Math.round(mobHov.height)
    }
  });

  console.log(`\n=== Mobile (375px) Measurements ===`);
  console.log(`Default:  ${mobDef.width.toFixed(1)} x ${mobDef.height.toFixed(1)}`);
  console.log(`Revealed: ${mobHov.width.toFixed(1)} x ${mobHov.height.toFixed(1)}`);
  console.log(`Δ Width: ${Math.abs(mobHov.width - mobDef.width).toFixed(2)}, Δ Height: ${Math.abs(mobHov.height - mobDef.height).toFixed(2)}`);

  // Keyboard accessibility check
  const kbPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await kbPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await kbPage.locator('#leadership').scrollIntoViewIfNeeded();
  await kbPage.waitForTimeout(500);

  const firstCard = await kbPage.$('#leadership [tabindex="0"]');
  await firstCard.focus();
  await kbPage.waitForTimeout(400);

  const kbRevealed = await firstCard.evaluate(el => {
    const bioOverlay = el.querySelector('.z-20');
    return bioOverlay ? window.getComputedStyle(bioOverlay).opacity : '0';
  });
  console.log(`\n=== Keyboard Accessibility ===`);
  console.log(`Card focused via .focus(): Bio opacity = ${kbRevealed}`);

  await browser.close();
}

main().catch(console.error);
