import { chromium } from "playwright";

async function verifyWatermark() {
  console.log("🔍 Verifying About section CALDIM logo watermark in Dark & Light modes...\n");
  const browser = await chromium.launch();
  
  // Desktop
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto("http://localhost:3000/#about", { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(1500);

    // Dark Mode Desktop
    await page.evaluate(() => document.documentElement.classList.remove("light"));
    await page.waitForTimeout(300);
    const box = await page.locator("#about").boundingBox();
    if (box) {
      await page.screenshot({ path: "scripts/about-watermark-dark-desktop.png", clip: box });
      console.log("📸 Saved Dark Desktop screenshot");
    }

    // Light Mode Desktop
    await page.evaluate(() => document.documentElement.classList.add("light"));
    await page.waitForTimeout(300);
    if (box) {
      await page.screenshot({ path: "scripts/about-watermark-light-desktop.png", clip: box });
      console.log("📸 Saved Light Desktop screenshot");
    }
    await page.close();
  }

  // Mobile
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto("http://localhost:3000/#about", { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(1500);

    // Dark Mode Mobile
    await page.evaluate(() => document.documentElement.classList.remove("light"));
    await page.waitForTimeout(300);
    const box = await page.locator("#about").boundingBox();
    if (box) {
      await page.screenshot({ path: "scripts/about-watermark-dark-mobile.png", clip: box });
      console.log("📸 Saved Dark Mobile screenshot");
    }

    // Light Mode Mobile
    await page.evaluate(() => document.documentElement.classList.add("light"));
    await page.waitForTimeout(300);
    if (box) {
      await page.screenshot({ path: "scripts/about-watermark-light-mobile.png", clip: box });
      console.log("📸 Saved Light Mobile screenshot");
    }

    const mobileOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    if (mobileOverflow) {
      console.error("❌ Mobile viewport has horizontal overflow!");
    } else {
      console.log("✅ Mobile layout: Zero horizontal overflow.");
    }

    await page.close();
  }

  await browser.close();
  console.log("\n🎉 ALL SCREENSHOTS CAPTURED SUCCESSFULLY!");
}

verifyWatermark();
