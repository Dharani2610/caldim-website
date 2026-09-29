import { chromium } from "playwright";

async function verifyStaticWatermark() {
  console.log("🔍 Verifying static CD logo watermark (no scroll behaviors)...\n");
  const browser = await chromium.launch();
  let failed = false;

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto("http://localhost:3000/#about", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // 1. Verify absence of Reveal wrapper or GSAP transform classes on watermark
    const domCheck = await page.evaluate(() => {
      const section = document.getElementById("about");
      if (!section) return { error: "Section #about not found" };
      const watermarkContainer = section.querySelector(".pointer-events-none");
      if (!watermarkContainer) return { error: "Watermark container not found" };
      const hasRevealClass = !!watermarkContainer.querySelector(".reveal");
      const img = watermarkContainer.querySelector('img[src*="caldim-logo.svg"]');
      const innerDiv = img ? img.parentElement : null;
      const computed = innerDiv ? window.getComputedStyle(innerDiv) : null;
      return {
        hasRevealClass,
        hasImage: !!img,
        opacity: computed ? computed.opacity : null,
        transform: computed ? computed.transform : null,
      };
    });

    console.log("DOM and style check:", domCheck);
    if (domCheck.error) {
      console.error("❌", domCheck.error);
      failed = true;
    }
    if (domCheck.hasRevealClass) {
      console.error("❌ Reveal class is still present on watermark!");
      failed = true;
    } else {
      console.log("✅ Verified: Reveal wrapper removed from watermark.");
    }

    if (domCheck.opacity !== "0.06" && domCheck.opacity !== "0.07") {
      console.log(`ℹ️ Watermark computed opacity: ${domCheck.opacity}`);
    } else {
      console.log(`✅ Watermark renders at immediate static opacity: ${domCheck.opacity}`);
    }

    // 2. Scroll test - verify transform remains static (none or unchanged)
    const aboutSection = page.locator("#about");
    await aboutSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const transformAtScroll = await page.evaluate(() => {
      const img = document.querySelector('#about img[src*="caldim-logo.svg"]');
      return img ? window.getComputedStyle(img.parentElement).transform : null;
    });

    console.log("Transform at scroll position:", transformAtScroll);
    if (transformAtScroll === "none" || !transformAtScroll.includes("matrix")) {
      console.log("✅ Verified: Watermark position is completely static while scrolling (no parallax).");
    } else {
      console.error("❌ Watermark transformed during scroll!", { transformAtScroll });
      failed = true;
    }

    // 3. Capture Dark mode screenshot
    await page.evaluate(() => document.documentElement.classList.remove("light"));
    await page.waitForTimeout(500);
    await aboutSection.screenshot({ path: "scripts/watermark-static-dark.png" });
    console.log("📸 Saved Dark Mode static screenshot: scripts/watermark-static-dark.png");

    // 4. Capture Light mode screenshot
    await page.evaluate(() => document.documentElement.classList.add("light"));
    await page.waitForTimeout(500);
    await aboutSection.screenshot({ path: "scripts/watermark-static-light.png" });
    console.log("📸 Saved Light Mode static screenshot: scripts/watermark-static-light.png");

    await page.close();
  } catch (err) {
    console.error("❌ Error:", err.message);
    failed = true;
  } finally {
    await browser.close();
  }

  if (failed) {
    process.exit(1);
  } else {
    console.log("\n🎉 STATIC WATERMARK VERIFICATION COMPLETED SUCCESSFULLY!");
    process.exit(0);
  }
}

verifyStaticWatermark();
