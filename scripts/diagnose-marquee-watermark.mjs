import { chromium } from "playwright";

async function diagnose() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const data = await page.evaluate(() => {
    const marquee = document.querySelector('section[aria-label="What we stand for"]');
    const certs = document.querySelector('section[aria-labelledby="certs-heading"]');
    const whyUs = document.querySelector('section[aria-labelledby="why-heading"]');
    const wrapper = marquee?.closest('.relative.overflow-hidden');
    const bgLayer = wrapper?.querySelector('.bg-fixed');

    const getBox = (el) => el ? el.getBoundingClientRect() : null;
    const getStyle = (el) => el ? window.getComputedStyle(el) : null;

    return {
      marqueeBox: getBox(marquee),
      certsBox: getBox(certs),
      whyUsBox: getBox(whyUs),
      wrapperBox: getBox(wrapper),
      bgLayerBox: getBox(bgLayer),
      wrapperHeight: wrapper?.offsetHeight,
      marqueeHeight: marquee?.offsetHeight,
      certsHeight: certs?.offsetHeight,
      whyUsHeight: whyUs?.offsetHeight,
      bgLayerComputed: {
        backgroundPosition: getStyle(bgLayer)?.backgroundPosition,
        backgroundSize: getStyle(bgLayer)?.backgroundSize,
        backgroundAttachment: getStyle(bgLayer)?.backgroundAttachment,
        opacity: getStyle(bgLayer)?.opacity,
        zIndex: getStyle(bgLayer)?.zIndex,
      },
      marqueeComputed: {
        backgroundColor: getStyle(marquee)?.backgroundColor,
        backgroundImage: getStyle(marquee)?.backgroundImage,
        zIndex: getStyle(marquee)?.zIndex,
      }
    };
  });

  console.log("Diagnostic Data:", JSON.stringify(data, null, 2));
  await browser.close();
}

diagnose();
