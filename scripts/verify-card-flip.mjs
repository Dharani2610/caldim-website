import { chromium } from 'playwright';

async function verifyCardFlip() {
  console.log('=== STARTING 3D CARD FLIP VERIFICATION ===\n');

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Scroll to services
  await page.evaluate(() => {
    document.getElementById('services')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(1000);

  // 1. Capture initial front state screenshot
  console.log('1. Capturing Initial Front Face State...');
  const firstCard = await page.$('#services .grid > div:first-child');
  if (firstCard) {
    await firstCard.screenshot({ path: 'scripts/card-flip-1-front.png' });
    console.log('Saved: scripts/card-flip-1-front.png');
  }

  // 2. Click "Learn more" on Card 0
  console.log('2. Clicking "Learn more" on Card 0 (Estimation & Takeoff)...');
  const learnMoreBtn0 = await page.$('#services .grid > div:nth-child(1) button');
  if (learnMoreBtn0) {
    await learnMoreBtn0.click();
  }
  await page.waitForTimeout(600); // Allow flip transition to finish

  // Inspect Card 0 flipped state
  const card0State = await page.evaluate(() => {
    const card = document.querySelector('#services .grid > div:nth-child(1)');
    const flipWrapper = card?.querySelector('[style*="preserve-3d"], [class*="preserve-3d"]');
    const transform = window.getComputedStyle(flipWrapper).transform;
    const isFrontAriaHidden = card?.querySelector('#service-front-estimation')?.getAttribute('aria-hidden');
    const isBackAriaHidden = card?.querySelector('#service-back-estimation')?.getAttribute('aria-hidden');
    const backHeading = card?.querySelector('#service-back-estimation h3')?.textContent?.trim();
    const deliverables = Array.from(card?.querySelectorAll('#service-back-estimation li') || []).map(li => li.textContent?.trim());
    return {
      hasTransform: transform !== 'none',
      transform,
      isFrontAriaHidden,
      isBackAriaHidden,
      backHeading,
      deliverables
    };
  });
  console.log('Card 0 Flipped State:', JSON.stringify(card0State, null, 2));

  if (firstCard) {
    await firstCard.screenshot({ path: 'scripts/card-flip-2-back.png' });
    console.log('Saved: scripts/card-flip-2-back.png');
  }

  // 3. Test Independent Flipping: Click "Learn more" on Card 1 (Structural Steel Detailing)
  console.log('3. Testing Independent Flipping: Clicking "Learn more" on Card 1...');
  const learnMoreBtn1 = await page.$('#services .grid > div:nth-child(2) button');
  if (learnMoreBtn1) {
    await learnMoreBtn1.click();
  }
  await page.waitForTimeout(600);

  const multiFlipState = await page.evaluate(() => {
    const card0BackHidden = document.querySelector('#service-back-estimation')?.getAttribute('aria-hidden');
    const card1BackHidden = document.querySelector('#service-back-structural')?.getAttribute('aria-hidden');
    const card2BackHidden = document.querySelector('#service-back-misc')?.getAttribute('aria-hidden');
    return {
      card0Flipped: card0BackHidden === 'false',
      card1Flipped: card1BackHidden === 'false',
      card2Flipped: card2BackHidden === 'false',
    };
  });
  console.log('Multi-flip independent check (Cards 0 and 1 both flipped, Card 2 front):', multiFlipState);

  const servicesGrid = await page.$('#services .grid');
  if (servicesGrid) {
    await servicesGrid.screenshot({ path: 'scripts/card-flip-3-multiflip.png' });
    console.log('Saved: scripts/card-flip-3-multiflip.png');
  }

  // 4. Test Flip Back: Click "Back to overview" on Card 0
  console.log('4. Clicking "Back to overview" on Card 0...');
  const backBtn0 = await page.$('#service-back-estimation button');
  if (backBtn0) {
    await backBtn0.click();
  }
  await page.waitForTimeout(600);

  const card0RestoredState = await page.evaluate(() => {
    const isFrontAriaHidden = document.querySelector('#service-front-estimation')?.getAttribute('aria-hidden');
    const isBackAriaHidden = document.querySelector('#service-back-estimation')?.getAttribute('aria-hidden');
    const hasCanvas = !!document.querySelector('#service-front-estimation canvas');
    return { isFrontAriaHidden, isBackAriaHidden, hasCanvas };
  });
  console.log('Card 0 Restored State:', card0RestoredState);

  if (firstCard) {
    await firstCard.screenshot({ path: 'scripts/card-flip-4-restored.png' });
    console.log('Saved: scripts/card-flip-4-restored.png');
  }

  // 5. Test Reduced Motion
  console.log('\n5. Testing prefers-reduced-motion: reduce...');
  const rmContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce'
  });
  const rmPage = await rmContext.newPage();
  await rmPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await rmPage.evaluate(() => document.getElementById('services')?.scrollIntoView({ behavior: 'instant', block: 'start' }));
  await rmPage.waitForTimeout(800);

  const rmTransition = await rmPage.evaluate(() => {
    const flipWrapper = document.querySelector('#services .grid > div:nth-child(1) [class*="preserve-3d"]');
    return window.getComputedStyle(flipWrapper).transition;
  });
  console.log('Reduced motion transition computed style:', rmTransition);

  // Click learn more under reduced motion
  const rmBtn = await rmPage.$('#services .grid > div:nth-child(1) button');
  if (rmBtn) await rmBtn.click();
  await rmPage.waitForTimeout(50); // Instant swap check

  const rmFlippedState = await rmPage.evaluate(() => {
    const isBackAriaHidden = document.querySelector('#service-back-estimation')?.getAttribute('aria-hidden');
    return { isBackAriaHidden };
  });
  console.log('Reduced motion instant flip check (back face immediately visible):', rmFlippedState);
  await rmContext.close();

  // 6. Check for horizontal overflow across viewports
  console.log('\n6. Checking Horizontal Overflow across viewports...');
  for (const width of [1440, 768, 375]) {
    const testContext = await browser.newContext({ viewport: { width, height: 800 } });
    const testPage = await testContext.newPage();
    await testPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    const overflow = await testPage.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    console.log(`Viewport ${width}px horizontal overflow:`, overflow ? 'FAILED (has overflow)' : 'PASSED (no overflow)');
    await testContext.close();
  }

  console.log(`\nConsole Errors (${consoleErrors.length}):`, consoleErrors);
  await context.close();
  await browser.close();
  console.log('\n=== ALL CARD FLIP VERIFICATIONS COMPLETE ===');
}

verifyCardFlip().catch(console.error);
