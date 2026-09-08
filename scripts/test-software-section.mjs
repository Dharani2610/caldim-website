import { chromium } from "playwright";

async function verifySoftwareSection() {
  console.log("🔍 Verifying Software & Technology Showcase...\n");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  let failed = false;

  try {
    await page.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(2000);

    const checkData = await page.evaluate(() => {
      const section = document.getElementById("about");
      if (!section) return { foundSection: false };

      const images = Array.from(section.querySelectorAll("img")).filter(
        (img) => (img.getAttribute("src") || "").includes("software") || (img.getAttribute("alt") || "").toLowerCase().includes("logo")
      );
      const logoInfos = images.map((img) => ({
        src: decodeURIComponent(img.getAttribute("src") || ""),
        alt: img.getAttribute("alt"),
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      }));

      // Check card containers
      const cards = Array.from(section.querySelectorAll("div.grid:first-of-type > div.reveal, div.grid:first-of-type > div > div.group"));

      return {
        foundSection: true,
        logoCount: images.length,
        logos: logoInfos,
      };
    });

    if (!checkData.foundSection) {
      console.error("❌ Section #about not found!");
      failed = true;
    } else {
      console.log(`✅ Found Software & Technology section.`);
      console.log(`✅ Software logo count: ${checkData.logoCount} (Expected: 4)`);

      if (checkData.logoCount !== 4) {
        console.error(`❌ Expected exactly 4 cards, found ${checkData.logoCount}`);
        failed = true;
      }

      console.log("Logos present on page:");
      for (const logo of checkData.logos) {
        console.log(` - ${logo.alt} (${logo.src}) [${logo.naturalWidth}x${logo.naturalHeight}]`);
      }

      const hasTekla = checkData.logos.some((l) => l.src.includes("tekla.png") && !l.src.includes("tekla-powerfab"));
      const hasSDS2 = checkData.logos.some((l) => l.src.includes("sds2.png"));
      const hasAutoCAD = checkData.logos.some((l) => l.src.includes("autocad.png"));
      const hasBluebeam = checkData.logos.some((l) => l.src.includes("bluebeam.png"));
      const hasPowerFab = checkData.logos.some((l) => l.src.includes("tekla-powerfab"));
      const hasIdeaStatica = checkData.logos.some((l) => l.src.includes("ideastatica"));
      const hasRAM = checkData.logos.some((l) => l.src.includes("ramconnection"));

      if (!hasTekla || !hasSDS2 || !hasAutoCAD || !hasBluebeam) {
        console.error("❌ Missing one of the required 4 logos!");
        failed = true;
      } else {
        console.log("✅ Exactly the 4 required logos (Tekla, SDS2, AutoCAD, Bluebeam) are present.");
      }

      if (hasPowerFab || hasIdeaStatica || hasRAM) {
        console.error("❌ One of the removed logos (PowerFab, IdeaStatica, RAM Connection) is still present!");
        failed = true;
      } else {
        console.log("✅ Tekla PowerFab, Idea StatiCa, and RAM Connection are completely removed.");
      }
    }

    // Test Mobile viewport layout
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);
    const mobileOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    if (mobileOverflow) {
      console.error("❌ Mobile viewport has horizontal overflow!");
      failed = true;
    } else {
      console.log("✅ Mobile layout (390x844): Zero horizontal overflow.");
    }
  } catch (err) {
    console.error("❌ Verification error:", err.message);
    failed = true;
  } finally {
    await browser.close();
  }

  if (failed) {
    process.exit(1);
  } else {
    console.log("\n🎉 SOFTWARE SECTION VERIFICATION COMPLETED SUCCESSFULLY!");
    process.exit(0);
  }
}

verifySoftwareSection();
