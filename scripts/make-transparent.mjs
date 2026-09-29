import sharp from 'sharp';
import path from 'path';

async function processImage() {
  const inputPath = path.join(process.cwd(), 'public/images/iso-full-model.original.png');
  const outputPath = path.join(process.cwd(), 'public/images/iso-full-model.png');

  const image = sharp(inputPath);
  const metadata = await image.metadata();
  console.log(`Processing image: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);

  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  const numPixels = info.width * info.height;
  const channels = info.channels;
  const outBuffer = Buffer.alloc(numPixels * 4);

  const whiteThreshold = 250; // Anything above 250 is pure background transparency

  for (let i = 0; i < numPixels; i++) {
    const srcIdx = i * channels;
    const dstIdx = i * 4;

    const r = data[srcIdx];
    const g = data[srcIdx + 1];
    const b = data[srcIdx + 2];

    // Compute grayscale / luminance
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    if (lum >= whiteThreshold) {
      outBuffer[dstIdx] = 0;
      outBuffer[dstIdx + 1] = 0;
      outBuffer[dstIdx + 2] = 0;
      outBuffer[dstIdx + 3] = 0; // Fully transparent
    } else {
      // Calculate alpha based on line density with smooth transition
      const alpha = Math.min(255, Math.max(0, Math.round(((whiteThreshold - lum) / whiteThreshold) * 255)));

      // Keep linework as clean black/dark tone (0, 0, 0)
      outBuffer[dstIdx] = 0;
      outBuffer[dstIdx + 1] = 0;
      outBuffer[dstIdx + 2] = 0;
      outBuffer[dstIdx + 3] = alpha;
    }
  }

  // Save as high quality PNG
  await sharp(outBuffer, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  console.log(`Successfully generated transparent PNG at ${outputPath}`);
}

processImage().catch(console.error);
