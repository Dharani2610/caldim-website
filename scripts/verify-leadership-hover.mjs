import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  
  // 1. Desktop test
  const page = await browser.newPage({ 
    viewport: { width: 1440, height: 900 }
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.locator('#leadership').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);

  // Take a full section screenshot of default state
  await page.locator('#leadership').screenshot({ path: 'scripts/leadership-section-default.png' });

  const cardStats = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('#leadership [tabindex="0"]'));
    return cards.map((c, i) => {
      const rect = c.getBoundingClientRect();
      const h3 = c.querySelector('h3');
      return {
        index: i,
        name: h3 ? h3.innerText.trim() : `Leader ${i + 1}`,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      };
    });
  });

  console.log('--- Desktop Leadership Cards Initial Measurements ---');
  console.table(cardStats);

  const hoverResults = [];

  for (let i = 0; i < cardStats.length; i++) {
    const info = cardStats[i];
    
    // Hover over center of card
    const cx = info.x + info.width / 2;
    const cy = info.y + info.height / 2;
    await page.mouse.move(cx, cy);
    await page.waitForTimeout(400);

    const statsDuringHover = await page.evaluate((idx) => {
      const cards = Array.from(document.querySelectorAll('#leadership [tabindex="0"]'));
      const card = cards[idx];
      const rect = card.getBoundingClientRect();
      const bioOverlay = card.querySelector('.z-20');
      const bioStyle = bioOverlay ? window.getComputedStyle(bioOverlay) : null;
      const scrollable = card.querySelector('.overflow-y-auto');
      return {
        width: rect.width,
        height: rect.height,
        bioOpacity: bioStyle ? bioStyle.opacity : null,
        scrollHeight: scrollable ? scrollable.scrollHeight : null,
        clientHeight: scrollable ? scrollable.clientHeight : null,
        isScrollable: scrollable ? scrollable.scrollHeight > scrollable.clientHeight : false
      };
    }, i);

    // Screenshot of card in revealed state using page clip
    const pad = 8;
    await page.screenshot({
      path: `scripts/leader-${i + 1}-${info.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-revealed.png`,
      clip: {
        x: Math.max(0, info.x - pad),
        y: Math.max(0, info.y - pad),
        width: info.width + pad * 2,
        height: info.height + pad * 2
      }
    });

    hoverResults.push({
      name: info.name,
      'Default WxH': `${info.width.toFixed(1)} x ${info.height.toFixed(1)}`,
      'Hovered WxH': `${statsDuringHover.width.toFixed(1)} x ${statsDuringHover.height.toFixed(1)}`,
      'Width Δ': Math.abs(statsDuringHover.width - info.width).toFixed(2),
      'Height Δ': Math.abs(statsDuringHover.height - info.height).toFixed(2),
      'Bio Revealed': statsDuringHover.bioOpacity === '1',
      'Inner Scroll Needed': statsDuringHover.isScrollable,
      'Scroll / Client H': `${statsDuringHover.scrollHeight} / ${statsDuringHover.clientHeight}`
    });

    // Unhover
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);

    // Screenshot of card in default state
    await page.screenshot({
      path: `scripts/leader-${i + 1}-${info.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-default.png`,
      clip: {
        x: Math.max(0, info.x - pad),
        y: Math.max(0, info.y - pad),
        width: info.width + pad * 2,
        height: info.height + pad * 2
      }
    });
  }

  console.log('\n--- Desktop Hover Transition Results ---');
  console.table(hoverResults);

  // 2. Keyboard Accessibility Test
  console.log('\n--- Keyboard Accessibility Test ---');
  await page.mouse.move(0, 0);
  await page.waitForTimeout(200);

  const keyFocusStats = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('#leadership [tabindex="0"]'));
    const card0 = cards[0];
    card0.focus();
    const bioOverlay = card0.querySelector('.z-20');
    const bioStyle = bioOverlay ? window.getComputedStyle(bioOverlay) : null;
    return {
      focusedTag: document.activeElement?.tagName,
      bioOpacity: bioStyle ? bioStyle.opacity : null
    };
  });
  console.log('Leader card 1 keyboard focus result:', keyFocusStats);

  // 3. Prefers-reduced-motion Test
  console.log('\n--- Reduced Motion Test ---');
  const rmPage = await browser.newPage({ 
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce'
  });
  await rmPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await rmPage.locator('#leadership').scrollIntoViewIfNeeded();
  await rmPage.waitForTimeout(500);

  const rmTransition = await rmPage.evaluate(() => {
    const bioOverlay = document.querySelector('#leadership [tabindex="0"] .z-20');
    return bioOverlay ? window.getComputedStyle(bioOverlay).transitionDuration : null;
  });
  console.log('Reduced motion transitionDuration on bio overlay:', rmTransition);

  // 4. Mobile (375px) Tap Test
  console.log('\n--- Mobile (375px) Tap Test ---');
  const mobPage = await browser.newPage({ 
    viewport: { width: 375, height: 812 }
  });
  await mobPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await mobPage.locator('#leadership').scrollIntoViewIfNeeded();
  await mobPage.waitForTimeout(1000);

  const mobDefaultStats = await mobPage.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('#leadership [tabindex="0"]'));
    return cards.map(c => {
      const rect = c.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
  });

  // Tap first card on mobile
  await mobPage.evaluate(() => {
    const card = document.querySelector('#leadership [tabindex="0"]');
    card.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await mobPage.waitForTimeout(400);

  const mobRevealedStats = await mobPage.evaluate(() => {
    const card = document.querySelector('#leadership [tabindex="0"]');
    const rect = card.getBoundingClientRect();
    const bioOverlay = card.querySelector('.z-20');
    const bioStyle = bioOverlay ? window.getComputedStyle(bioOverlay) : null;
    return {
      width: rect.width,
      height: rect.height,
      bioOpacity: bioStyle ? bioStyle.opacity : null
    };
  });

  console.log('Mobile Card 1 Default: ', mobDefaultStats[0]);
  console.log('Mobile Card 1 After Tap:', mobRevealedStats);
  console.log(`Mobile Dimension Delta: Width Δ = ${Math.abs(mobRevealedStats.width - mobDefaultStats[0].width).toFixed(2)}px, Height Δ = ${Math.abs(mobRevealedStats.height - mobDefaultStats[0].height).toFixed(2)}px`);

  // Mobile screenshot
  await mobPage.screenshot({ path: 'scripts/leadership-mobile-tapped.png' });

  await browser.close();
  console.log('\nAll tests completed successfully!');
}

main().catch(console.error);
