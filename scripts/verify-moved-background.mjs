import { chromium } from "playwright";

async function verifyMovedBackground() {
  console.log("🔍 Verifying background removal from SoftwareStandards and shared fixed background on TaglineMarquee+Certifications+WhyUs...\n");
  const browser = await chromium.launch();
  let failed = false;

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // 1. Verify SoftwareStandards has NO watermark
    const aboutCheck = await page.evaluate(() => {
      const about = document.getElementById("about");
      if (!about) return { error: "Section #about not found" };
      const watermark = about.querySelector('img[src*="caldim-logo.svg"]');
      const bgStyle = window.getComputedStyle(about);
      return {
        hasWatermark: !!watermark,
        bgColor: bgStyle.backgroundColor,
      };
    });

    console.log("SoftwareStandards check:", aboutCheck);
    if (aboutCheck.hasWatermark) {
      console.error("❌ SoftwareStandards still contains a watermark image!");
      failed = true;
    } else {
      console.log("✅ Verified: SoftwareStandards has no watermark image of its own.");
    }

    // 2. Verify shared fixed container on the 3 sections
    const sharedCheck = await page.evaluate(() => {
      const marquee = document.querySelector('section[aria-label="What we stand for"]');
      const certs = document.querySelector('section[aria-labelledby="certs-heading"]');
      const whyUs = document.querySelector('section[aria-labelledby="why-heading"]');

      if (!marquee || !certs || !whyUs) return { error: "Target sections missing" };

      const inner = marquee.parentElement;
      const sharedWrapper = inner ? inner.parentElement : null;
      const bgFixed = sharedWrapper ? sharedWrapper.querySelector('.bg-fixed') : null;
      const bgFixedStyle = bgFixed ? window.getComputedStyle(bgFixed) : null;

      return {
        sharedWrapper: !!sharedWrapper,
        hasBgFixed: !!bgFixed,
        bgAttachment: bgFixedStyle ? bgFixedStyle.backgroundAttachment : null,
        bgImage: bgFixedStyle ? bgFixedStyle.backgroundImage : null,
      };
    });

    console.log("Shared container check:", sharedCheck);
    if (!sharedCheck.hasBgFixed || sharedCheck.bgAttachment !== "fixed") {
      console.error("❌ Shared fixed background not found or backgroundAttachment is not fixed!");
      failed = true;
    } else {
      console.log("✅ Verified: Single shared fixed background is active across TaglineMarquee, Certifications, and WhyUs.");
    }

    // 3. Screenshots (Dark Mode)
    await page.evaluate(() => document.documentElement.classList.remove("light"));
    await page.waitForTimeout(500);

    // SoftwareStandards screenshot
    const aboutSection = page.locator("#about");
    await aboutSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await aboutSection.screenshot({ path: "scripts/software-standards-no-bg-dark.png" });
    console.log("📸 Saved: scripts/software-standards-no-bg-dark.png");

    // TaglineMarquee entering
    const marquee = page.locator('section[aria-label="What we stand for"]');
    await marquee.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "scripts/fixed-group-dark-1-marquee.png" });
    console.log("📸 Saved: scripts/fixed-group-dark-1-marquee.png");

    // Certifications mid
    const certs = page.locator('section[aria-labelledby="certs-heading"]');
    await certs.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "scripts/fixed-group-dark-2-certs.png" });
    console.log("📸 Saved: scripts/fixed-group-dark-2-certs.png");

    // WhyUs leaving
    const whyUs = page.locator('section[aria-labelledby="why-heading"]');
    await whyUs.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "scripts/fixed-group-dark-3-whyus.png" });
    console.log("📸 Saved: scripts/fixed-group-dark-3-whyus.png");

    // 4. Screenshots (Light Mode)
    await page.evaluate(() => document.documentElement.classList.add("light"));
    await page.waitForTimeout(500);

    await aboutSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await aboutSection.screenshot({ path: "scripts/software-standards-no-bg-light.png" });
    console.log("📸 Saved: scripts/software-standards-no-bg-light.png");

    await marquee.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "scripts/fixed-group-light-1-marquee.png" });
    console.log("📸 Saved: scripts/fixed-group-light-1-marquee.png");

    await certs.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "scripts/fixed-group-light-2-certs.png" });
    console.log("📸 Saved: scripts/fixed-group-light-2-certs.png");

    await whyUs.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "scripts/fixed-group-light-3-whyus.png" });
    console.log("📸 Saved: scripts/fixed-group-light-3-whyus.png");

    // 5. Overflow checks
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
    console.error("❌ Verification error:", err.message);
    failed = true;
  } finally {
    await browser.close();
  }

  if (failed) {
    process.exit(1);
  } else {
    console.log("\n🎉 ALL VERIFICATIONS COMPLETED SUCCESSFULLY!");
    process.exit(0);
  }
}

verifyMovedBackground();
