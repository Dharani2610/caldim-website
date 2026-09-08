import { chromium } from "playwright";

async function verifyTrustStrip() {
  console.log("🔍 Verifying Technology/Software Credibility Strip (TrustStrip)...\n");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  let failed = false;

  try {
    await page.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(2000);

    const check = await page.evaluate(() => {
      const section = document.querySelector("section[aria-label*='Credentials']");
      if (!section) return { found: false };

      const textEl = section.querySelector("p");
      const text = textEl ? textEl.textContent.trim() : "";

      const images = Array.from(section.querySelectorAll("img")).map((img) => ({
        src: decodeURIComponent(img.getAttribute("src") || ""),
        alt: img.getAttribute("alt") || "",
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      }));

      const docEl = document.documentElement;
      const isOverflow = docEl.scrollWidth > docEl.clientWidth;

      return {
        found: true,
        text,
        imageCount: images.length,
        images,
        isOverflow,
      };
    });

    if (!check.found) {
      console.error("❌ TrustStrip section not found!");
      failed = true;
    } else {
      console.log(`✅ Found Technology Credibility Strip.`);
      console.log(`✅ Technical Credibility Text: "${check.text}"`);
      console.log(`✅ Number of software cards: ${check.imageCount} (Expected: 4)`);

      if (check.imageCount !== 4) {
        console.error(`❌ Expected exactly 4 cards, found ${check.imageCount}`);
        failed = true;
      }

      console.log("Software cards present in credibility strip:");
      for (const img of check.images) {
        console.log(` - ${img.alt} (${img.src}) [${img.naturalWidth}x${img.naturalHeight}]`);
      }

      const hasBluebeam = check.images.some((i) => i.src.includes("bluebeam.png"));
      const hasTekla = check.images.some((i) => i.src.includes("tekla.png") && !i.src.includes("tekla-powerfab"));
      const hasSDS2 = check.images.some((i) => i.src.includes("sds2.png"));
      const hasAutoCAD = check.images.some((i) => i.src.includes("autocad.png"));

      const hasPowerFab = check.images.some((i) => i.src.includes("tekla-powerfab"));
      const hasIdeaStatica = check.images.some((i) => i.src.includes("ideastatica"));
      const hasRAM = check.images.some((i) => i.src.includes("ramconnection"));

      if (!hasBluebeam || !hasTekla || !hasSDS2 || !hasAutoCAD) {
        console.error("❌ Missing one of the required approved cards (Bluebeam, Tekla, SDS/2, AutoCAD)!");
        failed = true;
      } else {
        console.log("✅ Exactly the 4 approved tools (Bluebeam, Tekla, SDS2 by ALLPLAN, AutoCAD) are present.");
      }

      if (hasPowerFab || hasIdeaStatica || hasRAM) {
        console.error("❌ One of the removed tools (IDEA StatiCa, Tekla PowerFab, RAM Connection) is still present!");
        failed = true;
      } else {
        console.log("✅ IDEA StatiCa, Tekla PowerFab, and RAM Connection are completely removed.");
      }
    }

    // Test Mobile viewport (390x844)
    console.log("\n--- Testing Mobile Viewport (390x844) ---");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);

    const mobileCheck = await page.evaluate(() => {
      const docEl = document.documentElement;
      return {
        scrollWidth: docEl.scrollWidth,
        clientWidth: docEl.clientWidth,
        isOverflow: docEl.scrollWidth > docEl.clientWidth,
      };
    });

    if (mobileCheck.isOverflow) {
      console.error(`❌ Mobile overflow detected! scrollWidth=${mobileCheck.scrollWidth}, clientWidth=${mobileCheck.clientWidth}`);
      failed = true;
    } else {
      console.log(`✅ Mobile layout: Zero horizontal overflow (scrollWidth=${mobileCheck.scrollWidth} <= clientWidth=${mobileCheck.clientWidth}).`);
    }
  } catch (err) {
    console.error("❌ Test error:", err.message);
    failed = true;
  } finally {
    await browser.close();
  }

  if (failed) {
    process.exit(1);
  } else {
    console.log("\n🎉 ALL CREDIBILITY STRIP CHECKS PASSED PERFECTLY!");
    process.exit(0);
  }
}

verifyTrustStrip();
