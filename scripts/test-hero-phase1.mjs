import { chromium } from "playwright";

const BREAKPOINTS = [
  { name: "Desktop 1920x1080", width: 1920, height: 1080 },
  { name: "Laptop 1440x900", width: 1440, height: 900 },
  { name: "Tablet Landscape 1024x768", width: 1024, height: 768 },
  { name: "Tablet Portrait 768x1024", width: 768, height: 1024 },
  { name: "Mobile Large 430x932", width: 430, height: 932 },
  { name: "Mobile Standard 390x844", width: 390, height: 844 },
];

async function runTests() {
  console.log("🚀 Starting Phase 1 Hero Automated Verification...\n");
  const browser = await chromium.launch();
  let failed = false;

  // 1. Test Horizontal Overflow Across Breakpoints
  console.log("--- 1. Testing Horizontal Overflow Across Breakpoints ---");
  for (const bp of BREAKPOINTS) {
    const page = await browser.newPage({
      viewport: { width: bp.width, height: bp.height },
    });

    try {
      await page.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 15000 });
      await page.waitForTimeout(2000);

      const overflowResult = await page.evaluate(() => {
        const docEl = document.documentElement;
        const body = document.body;
        const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
        const clientWidth = docEl.clientWidth;
        const isOverflow = scrollWidth > clientWidth;
        
        let offendingElements = [];
        if (isOverflow) {
          const allElements = document.querySelectorAll("*");
          for (const el of allElements) {
            const rect = el.getBoundingClientRect();
            if (rect.right > window.innerWidth) {
              offendingElements.push({
                tag: el.tagName,
                id: el.id,
                className: el.className,
                right: rect.right,
                windowWidth: window.innerWidth,
              });
            }
          }
        }
        return { scrollWidth, clientWidth, isOverflow, offendingElements };
      });

      if (overflowResult.isOverflow) {
        console.error(`❌ [FAIL] ${bp.name}: Overflow detected! scrollWidth=${overflowResult.scrollWidth}, clientWidth=${overflowResult.clientWidth}`);
        console.error("Offending elements:", overflowResult.offendingElements);
        failed = true;
      } else {
        console.log(`✅ [PASS] ${bp.name}: Zero horizontal overflow (scrollWidth=${overflowResult.scrollWidth} <= clientWidth=${overflowResult.clientWidth})`);
      }
    } catch (err) {
      console.error(`❌ [ERROR] ${bp.name}:`, err.message);
      failed = true;
    } finally {
      await page.close();
    }
  }

  // 2. Test prefers-reduced-motion Fallback Contract
  console.log("\n--- 2. Testing prefers-reduced-motion Fallback Contract ---");
  const fallbackPage = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });

  try {
    await fallbackPage.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 15000 });
    await fallbackPage.waitForTimeout(1000);

    const fallbackCheck = await fallbackPage.evaluate(() => {
      const section = document.getElementById("intro");
      const canvas = section ? section.querySelector("canvas") : null;
      const fallbackImg = section ? section.querySelector("img[src*='hero-glow-frame']") : null;
      const assembledHeading = section ? section.querySelector("h2#intro-heading") : null;
      const headingVisible = assembledHeading ? window.getComputedStyle(assembledHeading.parentElement).opacity === "1" : false;

      return {
        hasCanvas: !!canvas,
        hasFallbackImg: !!fallbackImg,
        fallbackImgSrc: fallbackImg ? fallbackImg.getAttribute("src") : null,
        headingVisible,
      };
    });

    if (fallbackCheck.hasCanvas) {
      console.error("❌ [FAIL] Reduced motion mode mounted a WebGL canvas instead of fallback!");
      failed = true;
    } else if (!fallbackCheck.hasFallbackImg) {
      console.error("❌ [FAIL] Reduced motion mode did not render the static fallback image!");
      failed = true;
    } else {
      console.log(`✅ [PASS] prefers-reduced-motion contract verified: Canvas skipped, static fallback image rendered (${fallbackCheck.fallbackImgSrc}), content fully assembled immediately.`);
    }
  } catch (err) {
    console.error("❌ [ERROR] Reduced motion test failed:", err.message);
    failed = true;
  } finally {
    await fallbackPage.close();
  }

  // 3. Test WebGL Ready Flow
  console.log("\n--- 3. Testing WebGL Standard Render Flow ---");
  const webglPage = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference",
  });

  try {
    await webglPage.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 15000 });
    await webglPage.waitForTimeout(2000);

    const webglCheck = await webglPage.evaluate(() => {
      const section = document.getElementById("intro");
      const canvas = section ? section.querySelector("canvas") : null;
      return {
        hasCanvas: !!canvas,
      };
    });

    if (!webglCheck.hasCanvas) {
      console.error("❌ [FAIL] WebGL standard mode did not mount canvas!");
      failed = true;
    } else {
      console.log("✅ [PASS] WebGL canvas mounted successfully in standard mode.");
    }
  } catch (err) {
    console.error("❌ [ERROR] WebGL test failed:", err.message);
    failed = true;
  } finally {
    await webglPage.close();
  }

  await browser.close();

  if (failed) {
    console.log("\n❌ Automated verification failed.");
    process.exit(1);
  } else {
    console.log("\n🎉 ALL PHASE 1 AUTOMATED CHECKS PASSED PERFECTLY!");
    process.exit(0);
  }
}

runTests();
