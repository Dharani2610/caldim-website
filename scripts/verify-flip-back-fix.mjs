import { chromium } from 'playwright';

async function runFullVerification() {
  console.log('=== RUNNING COMPREHENSIVE FLIP-BACK INTERACTION TEST ===\n');

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  
  // Scroll to services section comfortably below the fixed header
  await page.evaluate(() => {
    const el = document.getElementById('services');
    if (el) {
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 100, behavior: 'instant' });
    }
  });
  await page.waitForTimeout(500);

  const cardIds = [
    'estimation',
    'structural',
    'misc',
    'connections',
    'joist-deck',
    'digital-automation'
  ];

  // Test flipping and flipping back each of the 6 cards individually
  for (let i = 0; i < cardIds.length; i++) {
    const id = cardIds[i];
    console.log(`\n--- TESTING CARD ${i} (${id}) ---`);

    // Ensure card is in view
    await page.evaluate((cardId) => {
      const card = document.getElementById(`service-front-${cardId}`);
      if (card) {
        const rect = card.getBoundingClientRect();
        if (rect.top < 120 || rect.bottom > window.innerHeight) {
          window.scrollBy({ top: rect.top - 150, behavior: 'instant' });
        }
      }
    }, id);
    await page.waitForTimeout(200);

    // 1. Click Learn more
    console.log(`Clicking "Learn more" on Card ${i}...`);
    await page.click(`#service-front-${id} button`);
    await page.waitForTimeout(600);

    const flippedState = await page.evaluate((id) => ({
      frontHidden: document.getElementById(`service-front-${id}`)?.getAttribute('aria-hidden'),
      frontClasses: document.getElementById(`service-front-${id}`)?.className,
      backHidden: document.getElementById(`service-back-${id}`)?.getAttribute('aria-hidden'),
      backClasses: document.getElementById(`service-back-${id}`)?.className,
      frontBtnTabIndex: document.querySelector(`#service-front-${id} button`)?.getAttribute('tabindex'),
      backBtnTabIndex: document.querySelector(`#service-back-${id} button`)?.getAttribute('tabindex'),
    }), id);
    console.log(`Card ${i} (${id}) flipped:`, {
      frontHidden: flippedState.frontHidden,
      backHidden: flippedState.backHidden,
      frontHasPointerNone: flippedState.frontClasses.includes('pointer-events-none'),
      backHasPointerAuto: flippedState.backClasses.includes('pointer-events-auto'),
      frontBtnTabIndex: flippedState.frontBtnTabIndex,
      backBtnTabIndex: flippedState.backBtnTabIndex
    });

    if (flippedState.frontHidden !== 'true' || flippedState.backHidden !== 'false' || !flippedState.frontClasses.includes('pointer-events-none')) {
      throw new Error(`Card ${i} (${id}) failed to flip to back properly!`);
    }

    // 2. Click Back to overview
    console.log(`Clicking "← Back to overview" on Card ${i}...`);
    await page.click(`#service-back-${id} button`);
    await page.waitForTimeout(600);

    const restoredState = await page.evaluate((id) => ({
      frontHidden: document.getElementById(`service-front-${id}`)?.getAttribute('aria-hidden'),
      frontClasses: document.getElementById(`service-front-${id}`)?.className,
      backHidden: document.getElementById(`service-back-${id}`)?.getAttribute('aria-hidden'),
      backClasses: document.getElementById(`service-back-${id}`)?.className,
      frontBtnTabIndex: document.querySelector(`#service-front-${id} button`)?.getAttribute('tabindex'),
      backBtnTabIndex: document.querySelector(`#service-back-${id} button`)?.getAttribute('tabindex'),
      hasCanvas: !!document.querySelector(`#service-front-${id} canvas`)
    }), id);
    console.log(`Card ${i} (${id}) restored:`, {
      frontHidden: restoredState.frontHidden,
      backHidden: restoredState.backHidden,
      frontHasPointerAuto: restoredState.frontClasses.includes('pointer-events-auto'),
      backHasPointerNone: restoredState.backClasses.includes('pointer-events-none'),
      frontBtnTabIndex: restoredState.frontBtnTabIndex,
      backBtnTabIndex: restoredState.backBtnTabIndex,
      hasCanvas: restoredState.hasCanvas
    });

    if (restoredState.frontHidden !== 'false' || restoredState.backHidden !== 'true' || !restoredState.frontClasses.includes('pointer-events-auto')) {
      throw new Error(`Card ${i} (${id}) failed to flip back to front!`);
    }
  }

  // TEST KEYBOARD ACCESSIBILITY (Tab / Focus + Enter / Space)
  console.log('\n--- TESTING KEYBOARD ACCESSIBILITY ---');
  
  // Test Enter key to flip forward
  console.log('Testing Keyboard Enter on Card 0 (estimation)...');
  await page.focus('#service-front-estimation button');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);
  const kbFlipped = await page.evaluate(() => document.getElementById('service-back-estimation')?.getAttribute('aria-hidden') === 'false');
  console.log('Keyboard Enter flipped to back:', kbFlipped);

  // Test Enter key to flip back
  console.log('Testing Keyboard Enter on Back button (estimation)...');
  await page.focus('#service-back-estimation button');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);
  const kbRestored = await page.evaluate(() => document.getElementById('service-front-estimation')?.getAttribute('aria-hidden') === 'false');
  console.log('Keyboard Enter flipped to front:', kbRestored);

  // Test Space key on Card 1 (structural)
  console.log('Testing Keyboard Space on Card 1 (structural)...');
  await page.focus('#service-front-structural button');
  await page.keyboard.press('Space');
  await page.waitForTimeout(600);
  const kbFlippedSpace = await page.evaluate(() => document.getElementById('service-back-structural')?.getAttribute('aria-hidden') === 'false');
  console.log('Keyboard Space flipped to back:', kbFlippedSpace);

  console.log('Testing Keyboard Space on Back button (structural)...');
  await page.focus('#service-back-structural button');
  await page.keyboard.press('Space');
  await page.waitForTimeout(600);
  const kbRestoredSpace = await page.evaluate(() => document.getElementById('service-front-structural')?.getAttribute('aria-hidden') === 'false');
  console.log('Keyboard Space flipped to front:', kbRestoredSpace);

  // SCREENSHOT OF RESTORED FRONT FACE
  console.log('\nCapturing screenshot of restored front face...');
  const cardElement = await page.$('#services .grid > div:first-child');
  if (cardElement) {
    await cardElement.screenshot({ path: 'scripts/card-flip-restored-verified.png' });
    console.log('Saved: scripts/card-flip-restored-verified.png');
  }

  // HOVER TILT INTERACTION
  console.log('\nTesting TiltCard hover on restored card...');
  const cardBox = await cardElement.boundingBox();
  await page.mouse.move(cardBox.x + cardBox.width * 0.8, cardBox.y + cardBox.height * 0.8);
  await page.waitForTimeout(300);
  const tiltStyle = await page.evaluate(() => {
    return document.querySelector('#services .grid > div:first-child .card-surface')?.getAttribute('style');
  });
  console.log('TiltCard style on mouse hover:', tiltStyle);

  console.log(`\nConsole Errors count (${consoleErrors.length}):`, consoleErrors);
  await browser.close();
  console.log('\n=== ALL 6 CARDS SUCCESSFULLY VERIFIED FLIP & BACK ===');
}

runFullVerification().catch((err) => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
