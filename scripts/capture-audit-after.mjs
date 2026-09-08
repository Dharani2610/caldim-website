import { chromium } from 'playwright';
import path from 'path';

const artifactsDir = 'C:/Users/USER/.gemini/antigravity-ide/brain/8c925e66-5091-4259-8405-398b889a7532';

async function capture() {
  const browser = await chromium.launch({ headless: true });

  const pagesToCapture = [
    { url: 'http://localhost:3000/', name: 'homepage' },
    { url: 'http://localhost:3000/certificates', name: 'certificates' },
    { url: 'http://localhost:3000/admin/login', name: 'admin-login' }
  ];

  for (const item of pagesToCapture) {
    // 1. Dark Theme
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      await page.goto(item.url, { waitUntil: 'networkidle' });
      await page.evaluate(() => {
        document.documentElement.classList.remove('light');
        localStorage.setItem('caldim-theme', 'dark');
      });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(artifactsDir, `after-${item.name}-dark.png`), fullPage: false });
      await context.close();
    }

    // 2. Light Theme
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      await page.goto(item.url, { waitUntil: 'networkidle' });
      await page.evaluate(() => {
        document.documentElement.classList.add('light');
        localStorage.setItem('caldim-theme', 'light');
      });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(artifactsDir, `after-${item.name}-light.png`), fullPage: false });
      await context.close();
    }
  }

  await browser.close();
  console.log('Successfully captured clean AFTER screenshots');
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
