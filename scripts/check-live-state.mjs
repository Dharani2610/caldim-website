import { chromium } from 'playwright';

async function checkLiveState() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await page.locator('#leadership').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);

  // Take a full section screenshot
  await page.locator('#leadership').screenshot({ path: 'scripts/live-leadership-section.png' });

  // Inspect the 4 cards
  const cards = await page.$$('#leadership [tabindex="0"]');
  console.log(`Found ${cards.length} leadership cards on live page.`);

  const cardDetails = [];

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const defaultBox = await card.boundingBox();
    const h3Name = await card.$eval('h3', el => el.innerText.trim());

    // Screenshot default
    await page.screenshot({
      path: `scripts/live-card-${i + 1}-${h3Name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-default.png`,
      clip: { x: Math.round(defaultBox.x), y: Math.round(defaultBox.y), width: Math.round(defaultBox.width), height: Math.round(defaultBox.height) }
    });

    // Check for "BIO" badge/trigger
    const bioBadgeExists = await card.evaluate(el => {
      const allText = Array.from(el.querySelectorAll('*')).map(e => e.textContent?.trim());
      return allText.some(t => t === 'BIO' || t === 'Bio');
    });

    // Hover card
    await page.mouse.move(defaultBox.x + defaultBox.width / 2, defaultBox.y + defaultBox.height / 2);
    await page.waitForTimeout(400);

    // Check if detail panel is revealed and what it contains
    const hoverState = await card.evaluate(el => {
      const bioOverlay = el.querySelector('.z-20');
      const bioStyle = bioOverlay ? window.getComputedStyle(bioOverlay) : null;
      const isVisible = bioStyle ? bioStyle.opacity === '1' : false;
      const innerText = bioOverlay ? bioOverlay.innerText : '';
      const hasEducation = innerText.includes('Education') || innerText.includes('EDUCATION');
      const hasExperience = innerText.includes('Experience') || innerText.includes('EXPERIENCE');
      const bullets = Array.from(bioOverlay?.querySelectorAll('li') || []).map(li => li.innerText.trim());
      
      return {
        isRevealedOnHover: isVisible,
        hasEducation,
        hasExperience,
        bulletCount: bullets.length,
        bullets,
        fullText: innerText
      };
    });

    // Screenshot hovered
    await page.screenshot({
      path: `scripts/live-card-${i + 1}-${h3Name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-hovered.png`,
      clip: { x: Math.round(defaultBox.x), y: Math.round(defaultBox.y), width: Math.round(defaultBox.width), height: Math.round(defaultBox.height) }
    });

    // Check if there is any external / right-side bio panel
    const sidePanelCheck = await page.evaluate(() => {
      // Check if any element in #leadership sits outside the 4 grid columns
      const section = document.querySelector('#leadership');
      const sidePanel = section?.querySelector('.side-panel, [data-side-panel], .detail-drawer, .bio-panel');
      return !!sidePanel;
    });

    cardDetails.push({
      index: i + 1,
      name: h3Name,
      bioBadgeExists,
      ...hoverState,
      sidePanelExists: sidePanelCheck
    });

    await page.mouse.move(0, 0);
    await page.waitForTimeout(200);
  }

  console.log('\n=== LIVE LEADERSHIP SECTION INSPECTION RESULTS ===');
  console.log(JSON.stringify(cardDetails, null, 2));

  await browser.close();
}

checkLiveState().catch(console.error);
