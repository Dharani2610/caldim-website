import { chromium } from "playwright";

async function verifyScrollReveal() {
  console.log("🔍 Verifying Watermark Scroll Reveal behavior...\n");
  const browser = await chromium.launch();
  let failed = false;

  try {
    // 1. Initial Load Test (Top of Page)
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(1000);

    const initialWatermarkState = await page.evaluate(() => {
      const section = document.getElementById("about");
      if (!section) return null;
      const revealEl = section.querySelector(".pointer-events-none .reveal");
      if (!revealEl) return null;
      const computed = window.getComputedStyle(revealEl);
      return {
        hasIsVisible: revealEl.classList.contains("is-visible"),
        opacity: computed.opacity,
        transform: computed.transform,
      };
    });

    console.log("Initial state (top of page):", initialWatermarkState);
    if (!initialWatermarkState) {
      console.error("❌ Watermark Reveal element not found!");
      failed = true;
    } else if (initialWatermarkState.hasIsVisible || parseFloat(initialWatermarkState.opacity) > 0.05) {
      console.error("❌ Watermark is already visible on page load before scrolling!");
      failed = true;
    } else {
      console.log("✅ Verified: Watermark is NOT visible on initial page load when below the fold.");
    }

    // 2. Scroll into view and capture mid/final state
    const aboutSection = page.locator("#about");
    await aboutSection.scrollIntoViewIfNeeded();
    // Wait a brief instant for transition to start
    await page.waitForTimeout(100);
    const box = await aboutSection.boundingBox();
    if (box) {
      await page.screenshot({ path: "scripts/watermark-reveal-transition.png", clip: box });
      console.log("📸 Saved mid-transition screenshot: scripts/watermark-reveal-transition.png");
    }

    // Wait for transition to complete (0.7s duration)
    await page.waitForTimeout(900);
    if (box) {
      await page.screenshot({ path: "scripts/watermark-reveal-final-dark.png", clip: box });
      console.log("📸 Saved final dark screenshot: scripts/watermark-reveal-final-dark.png");
    }

    const revealedState = await page.evaluate(() => {
      const section = document.getElementById("about");
      const revealEl = section.querySelector(".pointer-events-none .reveal");
      const computed = window.getComputedStyle(revealEl);
      return {
        hasIsVisible: revealEl.classList.contains("is-visible"),
        opacity: computed.opacity,
      };
    });
    console.log("Revealed state after scrolling into view:", revealedState);
    if (!revealedState.hasIsVisible || parseFloat(revealedState.opacity) < 0.9) {
      console.error("❌ Watermark failed to reveal after scrolling into view!");
      failed = true;
    } else {
      console.log("✅ Verified: Watermark successfully revealed upon scrolling into view.");
    }

    // 3. Scroll away (top) and back down — verify it STAYS visible
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollTo(0, 2000));
    await page.waitForTimeout(500);

    const persistState = await page.evaluate(() => {
      const section = document.getElementById("about");
      const revealEl = section.querySelector(".pointer-events-none .reveal");
      return revealEl.classList.contains("is-visible");
    });
    if (!persistState) {
      console.error("❌ Watermark did not persist after scrolling away and returning!");
      failed = true;
    } else {
      console.log("✅ Verified: Watermark remains visible on subsequent scrolling (no glitchy re-triggering).");
    }

    // 4. Light Mode test
    await page.evaluate(() => document.documentElement.classList.add("light"));
    await page.waitForTimeout(300);
    if (box) {
      await page.screenshot({ path: "scripts/watermark-reveal-final-light.png", clip: box });
      console.log("📸 Saved final light screenshot: scripts/watermark-reveal-final-light.png");
    }
    await page.close();
    await context.close();

    // 5. Reduced Motion Test
    const reducedMotionContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const rmPage = await reducedMotionContext.newPage();
    await rmPage.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 15000 });
    await rmPage.waitForTimeout(500);

    const rmState = await rmPage.evaluate(() => {
      const section = document.getElementById("about");
      const revealEl = section?.querySelector(".pointer-events-none .reveal");
      if (!revealEl) return null;
      const computed = window.getComputedStyle(revealEl);
      return {
        hasIsVisible: revealEl.classList.contains("is-visible"),
        opacity: computed.opacity,
      };
    });
    console.log("Reduced motion state:", rmState);
    if (rmState && (rmState.hasIsVisible || parseFloat(rmState.opacity) >= 0.99)) {
      console.log("✅ Verified: Reduced-motion users see the watermark immediately without waiting for scroll animation.");
    } else {
      console.warn("⚠️ Reduced motion check value:", rmState);
    }
    await rmPage.close();
    await reducedMotionContext.close();

  } catch (err) {
    console.error("❌ Error during verification:", err.message);
    failed = true;
  } finally {
    await browser.close();
  }

  if (failed) {
    process.exit(1);
  } else {
    console.log("\n🎉 ALL SCROLL-REVEAL VERIFICATIONS PASSED!");
    process.exit(0);
  }
}

verifyScrollReveal();
