import { chromium } from 'playwright';

async function runTests() {
  const browser = await chromium.launch();
  const port = 3001; // or 3000
  const baseUrl = `http://localhost:${port}`;

  console.log(`\n=== 1. STANDARD MOTION TEST ===`);
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log(`Navigating to ${baseUrl}...`);
  await page.goto(baseUrl, { waitUntil: 'networkidle' });

  // 1. Initial State before scroll
  const cardsBeforeScroll = await page.evaluate(() => {
    const section = document.getElementById('services');
    if (!section) return null;
    const cards = Array.from(section.querySelectorAll('.reveal'));
    return cards.map((c, i) => {
      const style = window.getComputedStyle(c);
      const rect = c.getBoundingClientRect();
      return {
        index: i,
        classes: c.className,
        hasIsVisible: c.classList.contains('is-visible'),
        inlineTransitionDelay: c.style.transitionDelay,
        computedOpacity: style.opacity,
        computedTransform: style.transform,
        top: rect.top,
        bottom: rect.bottom
      };
    });
  });

  console.log('Cards before scrolling (in initial viewport at top of page):');
  console.log(JSON.stringify(cardsBeforeScroll, null, 2));

  // Scroll down towards #services section
  console.log('\nScrolling down towards Services section...');
  
  // Step-wise scroll to observe staggered entry
  const observations = [];

  // Scroll to bring services section into view
  await page.evaluate(() => {
    const heading = document.getElementById('services-heading');
    heading?.scrollIntoView({ behavior: 'instant', block: 'center' });
  });

  // Capture immediately after scrollIntoView
  for (let step = 0; step < 10; step++) {
    const snapshot = await page.evaluate((stepNum) => {
      const section = document.getElementById('services');
      const cards = Array.from(section.querySelectorAll('.reveal'));
      return {
        step: stepNum,
        time: performance.now(),
        cards: cards.map((c, i) => ({
          index: i,
          hasIsVisible: c.classList.contains('is-visible'),
          opacity: window.getComputedStyle(c).opacity,
          transform: window.getComputedStyle(c).transform,
          transitionDelay: window.getComputedStyle(c).transitionDelay
        }))
      };
    }, step);
    observations.push(snapshot);
    await page.waitForTimeout(100);
  }

  console.log('\nStagger & Transition Snapshots across ~1000ms:');
  for (const obs of observations) {
    console.log(`Step ${obs.step} (T=${Math.round(obs.time)}ms):`,
      obs.cards.map(c => `[Card ${c.index}: vis=${c.hasIsVisible} delay=${c.transitionDelay} op=${parseFloat(c.opacity).toFixed(2)}]`).join(' ')
    );
  }

  // Check final state after all transitions complete (>1.5s)
  await page.waitForTimeout(1000);
  const finalState = await page.evaluate(() => {
    const section = document.getElementById('services');
    const cards = Array.from(section.querySelectorAll('.reveal'));
    return cards.map((c, i) => ({
      index: i,
      hasIsVisible: c.classList.contains('is-visible'),
      opacity: window.getComputedStyle(c).opacity,
      transform: window.getComputedStyle(c).transform
    }));
  });
  console.log('\nFinal Settled State after scroll:', JSON.stringify(finalState, null, 2));

  // Check 4: Scroll away and scroll back behavior
  console.log('\n=== 4. SCROLL AWAY & RETURN TEST (ONE-SHOT VS RETRIGGER) ===');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  const stateAtTop = await page.evaluate(() => {
    const section = document.getElementById('services');
    const cards = Array.from(section.querySelectorAll('.reveal'));
    return cards.map((c, i) => ({
      index: i,
      hasIsVisible: c.classList.contains('is-visible'),
      opacity: window.getComputedStyle(c).opacity
    }));
  });
  console.log('Cards state after scrolling back to top (should stay is-visible):', JSON.stringify(stateAtTop, null, 2));

  await context.close();

  // Check 3: prefers-reduced-motion test
  console.log('\n=== 3. PREFERS-REDUCED-MOTION TEST ===');
  const reducedMotionContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce'
  });
  const rmPage = await reducedMotionContext.newPage();
  await rmPage.goto(baseUrl, { waitUntil: 'networkidle' });

  const rmInitialState = await rmPage.evaluate(() => {
    const section = document.getElementById('services');
    const cards = Array.from(section.querySelectorAll('.reveal'));
    return cards.map((c, i) => ({
      index: i,
      hasIsVisible: c.classList.contains('is-visible'),
      computedOpacity: window.getComputedStyle(c).opacity,
      computedTransform: window.getComputedStyle(c).transform
    }));
  });
  console.log('Reduced motion cards state on initial load (without scrolling):');
  console.log(JSON.stringify(rmInitialState, null, 2));

  await reducedMotionContext.close();
  await browser.close();
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
