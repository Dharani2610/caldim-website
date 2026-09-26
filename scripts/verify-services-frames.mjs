import { chromium } from 'playwright';

async function captureStaggerSequence() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

  // Scroll so top of Services grid enters viewport
  console.log('Scrolling to Services section...');
  await page.evaluate(() => {
    const servicesSection = document.getElementById('services');
    servicesSection.scrollIntoView({ behavior: 'instant', block: 'start' });
  });

  // Capture frame sequence during stagger
  const frameTimes = [0, 50, 100, 150, 200, 300, 450, 600, 900];
  const frameData = [];

  for (const t of frameTimes) {
    await page.waitForTimeout(t === 0 ? 0 : t - (frameData[frameData.length - 1]?.t || 0));
    const cards = await page.evaluate(() => {
      const section = document.getElementById('services');
      const cardNodes = Array.from(section.querySelectorAll('.grid > .reveal'));
      return cardNodes.map((card, i) => {
        const style = window.getComputedStyle(card);
        return {
          cardIndex: i,
          title: card.querySelector('h3')?.textContent?.trim(),
          isVisible: card.classList.contains('is-visible'),
          transitionDelay: style.transitionDelay,
          opacity: parseFloat(style.opacity).toFixed(3),
          transform: style.transform
        };
      });
    });
    frameData.push({ t, cards });
  }

  console.log('\n--- FRAME-BY-FRAME STAGGER LOG ---');
  for (const frame of frameData) {
    console.log(`\nTime: ${frame.t}ms:`);
    for (const c of frame.cards) {
      console.log(`  Card ${c.cardIndex} (${c.title}): isVisible=${c.isVisible}, delay=${c.transitionDelay}, opacity=${c.opacity}, transform=${c.transform}`);
    }
  }

  // Also test all cards when scrolled fully into view
  await page.evaluate(() => {
    window.scrollBy(0, 400);
  });
  await page.waitForTimeout(1000);
  const allCardsSettled = await page.evaluate(() => {
    const section = document.getElementById('services');
    const cardNodes = Array.from(section.querySelectorAll('.grid > .reveal'));
    return cardNodes.map((card, i) => {
      const style = window.getComputedStyle(card);
      return {
        cardIndex: i,
        title: card.querySelector('h3')?.textContent?.trim(),
        isVisible: card.classList.contains('is-visible'),
        opacity: style.opacity,
        transform: style.transform
      };
    });
  });

  console.log('\n--- ALL CARDS SETTLED (SCROLLED) ---');
  console.log(JSON.stringify(allCardsSettled, null, 2));

  await browser.close();
}

captureStaggerSequence().catch(console.error);
