import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const src = path.join(
  root,
  "dist/public/assets/CLUBEDOGRITO_APPpng_Prancheta 1_1755627303160-BWIV1B9K.png",
);
const resourcesDir = path.join(root, "resources");
const iconOut = path.join(resourcesDir, "icon.png");
const splashOut = path.join(resourcesDir, "splash.png");
const splashSize = 2732;
const logoSize = Math.round(splashSize * 0.45);

await mkdir(resourcesDir, { recursive: true });

await sharp(src)
  .resize(1024, 1024, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 1 },
  })
  .png()
  .toFile(iconOut);

const logoBuffer = await sharp(src)
  .resize(logoSize, logoSize, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: splashSize,
    height: splashSize,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 1 },
  },
})
  .composite([{ input: logoBuffer, gravity: "center" }])
  .png()
  .toFile(splashOut);

console.log("Android asset sources created in resources/");
