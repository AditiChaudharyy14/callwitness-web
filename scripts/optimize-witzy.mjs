// Writes web-sized copies of the Witzy mascot: public/brand/witzy-800.webp and witzy-400.webp.
// Usage: npm run optimize:witzy
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const brand = fileURLToPath(new URL("../public/brand/", import.meta.url));

for (const size of [800, 400]) {
  const out = `${brand}witzy-${size}.webp`;
  const info = await sharp(`${brand}witzy.png`)
    .resize(size, size)
    .webp({ quality: 88, alphaQuality: 100 })
    .toFile(out);
  console.log(`witzy-${size}.webp  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(1)} KB`);
}
