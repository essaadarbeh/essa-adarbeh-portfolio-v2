// Writes the favicon and the home-screen icon from the lenses mark.
//
//   node scripts/make-icons.mjs
//
// app/icon.svg        browser tab: the mark on a paper tile, so it reads on
//                     light and dark tab bars alike
// app/apple-icon.png  home screen: light mark on the field blue
import sharp from "sharp";
import path from "node:path";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { lensesSvg } from "../lib/lenses.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INK = "#0b1238", FIELD = "#2b3bff", CHALK = "#eef0f6", SIGNAL = "#ffc24b";

await writeFile(path.join(ROOT, "app", "icon.svg"), lensesSvg(INK, FIELD, { background: CHALK, radius: 14, scale: 0.94 }));
await sharp(Buffer.from(lensesSvg(CHALK, SIGNAL, { size: 180, background: FIELD, radius: 0, scale: 0.78 })))
  .png()
  .toFile(path.join(ROOT, "app", "apple-icon.png"));
console.log("icons written");
