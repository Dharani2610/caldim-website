import { chromium } from "playwright";

async function verifySharedFixedWatermark() {
  console.log("🔍 Verifying single shared fixed watermark across TaglineMarquee, Certifications, and WhyUs...\n");
  const browser = await chromium.launch();
  let failed = false;

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // 1. Structure Verification
    const check = await page.evaluate(() => {
      const marquee = document.querySelector('section[aria-label="What we stand for"]');
      const certs = document.querySelector('section[aria-labelledby="certs-heading"]');
      const whyUs = document.querySelector('section[aria-labelledby="why-heading"]');
      const leadership = document.querySelector('section[aria-labelledby="leadership-heading"]');

      if (!marquee || !certs || !whyUs) {
        return { error: "Missing target sections" };
      }

      // Check inner container and parent wrapper
      const innerContainer = marquee.parentElement;
      const sharedWrapper = innerContainer ? innerContainer.parentElement : null;

      const bgLayer = sharedWrapper ? sharedWrapper.querySelector('.bg-fixed') : null;
      const bgStyle = bgLayer ? window.getComputedStyle(bgLayer) : null;

      // Count background layers in the 3-section container
      const allBgLayers = sharedWrapper ? sharedWrapper.querySelectorAll('.bg-fixed') : [];

      return {
        hasSharedWrapper: !!sharedWrapper,
        bgLayerCount: allBgLayers.length,
        bgAttachment: bgStyle ? bgStyle.backgroundAttachment : null,
        bgImage: bgStyle ? bgStyle.backgroundImage : null,
        marqueeBg: window.getComputedStyle(marquee).backgroundColor,
        certsBg: window.getComputedStyle(certs).backgroundColor,
        whyUsBg: window.getComputedStyle(whyUs).backgroundColor,
        leadershipOutside: leadership ? !sharedWrapper.contains(leadership) : false,
      };
    });

    console.log("Structure check result:", check);
    if (check.error) {
      console.error("❌", check.error);
      failed = true;
    }
    if (check.bgLayerCount !== 1) {
      console.error(`❌ Expected exactly 1 fixed background layer, found ${check.bgLayerCount}`);
      failed = true;
    } else {
      console.log("✅ Verified: Exactly 1 single fixed background layer is shared across all 3 sections.");
    }

    if (check.bgAttachment !== "fixed") {
      console.error(`❌ Expected background-attachment: fixed, found ${check.bgAttachment}`);
      failed = true;
    } else {
      console.log("✅ Verified: background-attachment: fixed is applied.");
    }

    // 2. Screenshots in Dark Mode at 3 positions
    await page.evaluate(() => document.documentElement.classList.remove("light"));
    await page.waitForTimeout(500);

    // Position 1: Entering TaglineMarquee
    const marquee = page.locator('section[aria-label="What we stand for"]');
    await marquee.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "scripts/fixed-watermark-dark-1-marquee.png" });
    console.log("📸 Saved: scripts/fixed-watermark-dark-1-marquee.png");

    // Position 2: Mid-Certifications
    const certs = page.locator('section[aria-labelledby="certs-heading"]');
    await certs.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "scripts/fixed-watermark-dark-2-certs.png" });
    console.log("📸 Saved: scripts/fixed-watermark-dark-2-certs.png");

    // Position 3: Leaving WhyUs
    const whyUs = page.locator('section[aria-labelledby="why-heading"]');
    await whyUs.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "scripts/fixed-watermark-dark-3-whyus.png" });
    console.log("📸 Saved: scripts/fixed-watermark-dark-3-whyus.png");

    // 3. Screenshots in Light Mode at 3 positions
    await page.evaluate(() => document.documentElement.classList.add("light"));
    await page.waitForTimeout(500);

    await marquee.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "scripts/fixed-watermark-light-1-marquee.png" });
    console.log("📸 Saved: scripts/fixed-watermark-light-1-marquee.png");

    await certs.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "scripts/fixed-watermark-light-2-certs.png" });
    console.log("📸 Saved: scripts/fixed-watermark-light-2-certs.png");

    await whyUs.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "scripts/fixed-watermark-light-3-whyus.png" });
    console.log("📸 Saved: scripts/fixed-watermark-light-3-whyus.png");

    // 4. Overflow check
    const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (desktopOverflow) {
      console.error("❌ Desktop viewport has horizontal overflow!");
      failed = true;
    } else {
      console.log("✅ Desktop viewport: Zero horizontal overflow.");
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (mobileOverflow) {
      console.error("❌ Mobile viewport has horizontal overflow!");
      failed = true;
    } else {
      console.log("✅ Mobile viewport: Zero horizontal overflow.");
    }

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
    console.log("\n🎉 SHARED FIXED WATERMARK VERIFICATION COMPLETED SUCCESSFULLY!");
    process.exit(0);
  }
}

verifySharedFixedWatermark();
