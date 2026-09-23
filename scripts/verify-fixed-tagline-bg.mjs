import { chromium } from "playwright";

async function verifyFixedBackground() {
  console.log("🔍 Verifying fixed background across TaglineMarquee, Certifications, and WhyUs...\n");
  const browser = await chromium.launch();
  let failed = false;

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // 1. Check DOM structure in page
    const structureCheck = await page.evaluate(() => {
      const marquee = document.querySelector('section[aria-label="What we stand for"]');
      const certs = document.querySelector('section[aria-labelledby="certs-heading"]');
      const whyUs = document.querySelector('section[aria-labelledby="why-heading"]');
      const leadership = document.querySelector('section[aria-labelledby="leadership-heading"]');

      if (!marquee || !certs || !whyUs) {
        return { error: "Could not find one or more target sections" };
      }

      const parentMarquee = marquee.parentElement;
      const parentCerts = certs.parentElement;
      const parentWhyUs = whyUs.parentElement;

      const sharedParent = parentMarquee === parentCerts && parentCerts === parentWhyUs;
      const parentComputed = parentMarquee ? window.getComputedStyle(parentMarquee) : null;
      const marqueeComputed = window.getComputedStyle(marquee);
      const certsComputed = window.getComputedStyle(certs);
      const whyUsComputed = window.getComputedStyle(whyUs);

      return {
        sharedParent,
        parentBgAttachment: parentComputed ? parentComputed.backgroundAttachment : null,
        parentBgColor: parentComputed ? parentComputed.backgroundColor : null,
        marqueeBg: marqueeComputed.backgroundColor,
        certsBg: certsComputed.backgroundColor,
        whyUsBg: whyUsComputed.backgroundColor,
        isLeadershipOutside: leadership ? leadership.parentElement !== parentMarquee : false,
      };
    });

    console.log("Structure & CSS check:", structureCheck);
    if (!structureCheck.sharedParent) {
      console.error("❌ The three sections are not inside a single shared container!");
      failed = true;
    } else {
      console.log("✅ All three sections (TaglineMarquee, Certifications, WhyUs) share a single container.");
    }

    if (structureCheck.isLeadershipOutside) {
      console.log("✅ Leadership section is correctly positioned outside the shared fixed-background container.");
    } else {
      console.error("❌ Leadership section was included inside the fixed container!");
      failed = true;
    }

    // 2. Capture Screenshots in Dark Mode
    await page.evaluate(() => document.documentElement.classList.remove("light"));
    await page.waitForTimeout(500);

    // Position 1: Entering TaglineMarquee
    const marquee = page.locator('section[aria-label="What we stand for"]');
    await marquee.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "scripts/fixed-bg-dark-1-marquee.png" });
    console.log("📸 Saved: scripts/fixed-bg-dark-1-marquee.png");

    // Position 2: Mid-Certifications
    const certs = page.locator('section[aria-labelledby="certs-heading"]');
    await certs.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "scripts/fixed-bg-dark-2-certs.png" });
    console.log("📸 Saved: scripts/fixed-bg-dark-2-certs.png");

    // Position 3: Leaving WhyUs into Leadership
    const whyUs = page.locator('section[aria-labelledby="why-heading"]');
    await whyUs.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "scripts/fixed-bg-dark-3-whyus.png" });
    console.log("📸 Saved: scripts/fixed-bg-dark-3-whyus.png");

    // 3. Capture Screenshots in Light Mode
    await page.evaluate(() => document.documentElement.classList.add("light"));
    await page.waitForTimeout(500);

    await marquee.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "scripts/fixed-bg-light-1-marquee.png" });
    console.log("📸 Saved: scripts/fixed-bg-light-1-marquee.png");

    await certs.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "scripts/fixed-bg-light-2-certs.png" });
    console.log("📸 Saved: scripts/fixed-bg-light-2-certs.png");

    await whyUs.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "scripts/fixed-bg-light-3-whyus.png" });
    console.log("📸 Saved: scripts/fixed-bg-light-3-whyus.png");

    // 4. Check horizontal overflow on desktop & mobile
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
    console.log("\n🎉 FIXED BACKGROUND VERIFICATION COMPLETED SUCCESSFULLY!");
    process.exit(0);
  }
}

verifyFixedBackground();
