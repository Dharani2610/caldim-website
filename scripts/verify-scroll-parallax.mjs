import { chromium } from "playwright";

async function verifyParallax() {
  console.log("🔍 Verifying CD watermark scroll parallax...\n");
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const aboutSection = page.locator("#about");
    const aboutBox = await aboutSection.boundingBox();
    if (!aboutBox) throw new Error("#about section boundingBox not found");

    console.log("About section Y:", aboutBox.y);

    // Scroll to top of about section
    await page.evaluate((targetY) => window.scrollTo(0, targetY - 400), aboutBox.y);
    await page.waitForTimeout(500);

    const transformTop = await page.evaluate(() => {
      const img = document.querySelector("#about .pointer-events-none .will-change-transform");
      return img ? window.getComputedStyle(img).transform : null;
    });
    console.log("Watermark transform when scrolling towards About:", transformTop);

    // Scroll further down into about section
    await page.evaluate((targetY) => window.scrollTo(0, targetY + 300), aboutBox.y);
    await page.waitForTimeout(500);

    const transformMiddle = await page.evaluate(() => {
      const img = document.querySelector("#about .pointer-events-none .will-change-transform");
      return img ? window.getComputedStyle(img).transform : null;
    });
    console.log("Watermark transform when scrolling down inside About:", transformMiddle);

    // Scroll past about section
    await page.evaluate((targetY) => window.scrollTo(0, targetY + 800), aboutBox.y);
    await page.waitForTimeout(500);

    const transformBottom = await page.evaluate(() => {
      const img = document.querySelector("#about .pointer-events-none .will-change-transform");
      return img ? window.getComputedStyle(img).transform : null;
    });
    console.log("Watermark transform when scrolling further past About:", transformBottom);

    if (transformTop !== transformMiddle && transformMiddle !== transformBottom) {
      console.log("✅ Verified: Watermark transform dynamically tracks scroll position with smooth parallax!");
    } else {
      console.warn("⚠️ Transforms were identical:", { transformTop, transformMiddle, transformBottom });
    }

  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await browser.close();
  }
}

verifyParallax();
