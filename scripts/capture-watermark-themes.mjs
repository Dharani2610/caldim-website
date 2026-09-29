import { chromium } from "playwright";

async function verifyScreenshots() {
  const browser = await chromium.launch();
  
  // Dark mode
  const darkPage = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
  await darkPage.goto("http://localhost:3000/#about", { waitUntil: "networkidle" });
  await darkPage.evaluate(() => document.documentElement.classList.remove("light"));
  await darkPage.waitForTimeout(1000);
  const darkBox = await darkPage.locator("#about").boundingBox();
  if (darkBox) {
    await darkPage.screenshot({ path: "scripts/watermark-reveal-dark.png", clip: darkBox });
    console.log("📸 Saved dark mode screenshot: scripts/watermark-reveal-dark.png");
  }
  await darkPage.close();

  // Light mode
  const lightPage = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' });
  await lightPage.goto("http://localhost:3000/#about", { waitUntil: "networkidle" });
  await lightPage.evaluate(() => document.documentElement.classList.add("light"));
  await lightPage.waitForTimeout(1000);
  const lightBox = await lightPage.locator("#about").boundingBox();
  if (lightBox) {
    await lightPage.screenshot({ path: "scripts/watermark-reveal-light.png", clip: lightBox });
    console.log("📸 Saved light mode screenshot: scripts/watermark-reveal-light.png");
  }
  await lightPage.close();

  await browser.close();
}

verifyScreenshots();
