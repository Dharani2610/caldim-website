import fs from "node:fs/promises";
import path from "node:path";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "@napi-rs/canvas";
import sharp from "sharp";

/**
 * Renders the first page of every PDF in `public/certificates/` to a high-quality WebP thumbnail
 * in `public/certificates/thumbnails/`.
 *
 * Uses `pdfjs-dist` (pure JS PDF interpreter) + `@napi-rs/canvas` (prebuilt native Skia canvas
 * binaries for Windows/Linux/macOS with 0 system dependencies) + `sharp` (WebP optimization).
 */
async function generateAllThumbnails() {
  console.log("=== Generating Certificate PDF Thumbnails ===");
  const certificatesDir = path.resolve("public/certificates");
  const thumbnailsDir = path.resolve("public/certificates/thumbnails");

  await fs.mkdir(thumbnailsDir, { recursive: true });

  const entries = await fs.readdir(certificatesDir, { withFileTypes: true });
  const pdfFiles = entries.filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".pdf"));

  console.log(`Found ${pdfFiles.length} PDF file(s) in ${certificatesDir}\n`);

  const results = [];

  for (const pdfFile of pdfFiles) {
    const filename = pdfFile.name;
    const baseName = path.parse(filename).name;
    const fullPath = path.join(certificatesDir, filename);

    try {
      const data = new Uint8Array(await fs.readFile(fullPath));
      const doc = await pdfjsLib.getDocument({
        data,
        useSystemFonts: true,
        disableFontFace: false,
      }).promise;

      const page = await doc.getPage(1);
      const originalViewport = page.getViewport({ scale: 1.0 });

      // Scale to target render width around ~1400px for crisp downsampling to 720px
      const scale = Math.max(1.5, 1440 / originalViewport.width);
      const viewport = page.getViewport({ scale });

      const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
      const context = canvas.getContext("2d");

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      const pngBuffer = canvas.toBuffer("image/png");
      const webpBuffer = await sharp(pngBuffer)
        .resize({ width: 720, withoutEnlargement: true })
        .webp({ quality: 88, effort: 4 })
        .toBuffer();

      // Save as exact basename .webp
      const outPath = path.join(thumbnailsDir, `${baseName}.webp`);
      await fs.writeFile(outPath, webpBuffer);

      const meta = await sharp(webpBuffer).metadata();

      results.push({
        filename,
        success: true,
        outputFile: `${baseName}.webp`,
        width: meta.width,
        height: meta.height,
        sizeBytes: webpBuffer.byteLength,
        pages: doc.numPages,
      });

      console.log(`✓ [SUCCESS] "${filename}" -> "${baseName}.webp" (${meta.width}x${meta.height}, ${(webpBuffer.byteLength / 1024).toFixed(1)} KB, 1/${doc.numPages} pages)`);
    } catch (err) {
      console.error(`✗ [FAILED] "${filename}": ${err.message}`);
      results.push({
        filename,
        success: false,
        error: err.message,
      });
    }
  }

  console.log("\n--- Generation Summary ---");
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  console.log(`Total: ${results.length} | Generated: ${successful.length} | Failed: ${failed.length}`);

  return results;
}

generateAllThumbnails().catch((err) => {
  console.error("Fatal generation script error:", err);
  process.exit(1);
});
