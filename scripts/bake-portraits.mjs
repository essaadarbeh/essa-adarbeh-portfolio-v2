// Bakes the cobalt tritone portraits (and their true-colour twins) that the
// WebGL lens blends between. The colour treatment lives in the asset, not in a
// runtime filter, so the shader only has to mix two textures.
//
//   npm run bake
//
// Per portrait: trim the transparent padding once, then from that one buffer
//   1. write the true-colour version untouched, and
//   2. stretch the luminance between its 1st and 99th percentile and remap it
//      through RAMP (ink -> cobalt -> sky -> chalk).
// Both outputs share dimensions, so their UVs line up pixel for pixel.

import sharp from "sharp";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "portraits");
const MAX_HEIGHT = 1800;

const PORTRAITS = [
  { src: "portrait-cut.png", out: "hero", gamma: 0.92 },
  // the back view is lit from behind and mostly shadow — lift it harder
  { src: "portrait-front-cut.png", out: "about", gamma: 0.78 },
];

// luminance (0–1) -> rgb. Shadows go deeper than the ink token so the figure
// separates from a cobalt field; highlights stop short of pure white.
const RAMP = [
  [0.0, [4, 7, 30]],
  [0.18, [12, 20, 84]],
  [0.42, [34, 50, 214]],
  [0.58, [66, 86, 255]],
  [0.76, [150, 166, 255]],
  [0.9, [212, 219, 255]],
  [1.0, [246, 247, 255]],
];

const hex = (c) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

function rampAt(t) {
  t = Math.min(1, Math.max(0, t));
  for (let i = 1; i < RAMP.length; i++) {
    const [t1, c1] = RAMP[i];
    if (t <= t1) {
      const [t0, c0] = RAMP[i - 1];
      const f = (t - t0) / (t1 - t0);
      return c0.map((v, k) => v + (c1[k] - v) * f);
    }
  }
  return RAMP.at(-1)[1];
}

async function bake({ src, out, gamma }) {
  const trimmed = await sharp(path.join(ROOT, "assets-source", src))
    .ensureAlpha()
    .trim({ threshold: 1 })
    .resize({ height: MAX_HEIGHT, withoutEnlargement: true })
    .png()
    .toBuffer();

  const { data, info } = await sharp(trimmed).raw().toBuffer({ resolveWithObject: true });
  const px = info.width * info.height;

  // luminance histogram over visible pixels only
  const hist = new Uint32Array(256);
  let visible = 0;
  for (let i = 0; i < px; i++) {
    if (data[i * 4 + 3] < 16) continue;
    const l = 0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2];
    hist[Math.round(l)]++;
    visible++;
  }
  const pct = (p) => {
    let run = 0;
    for (let v = 0; v < 256; v++) if ((run += hist[v]) >= visible * p) return v;
    return 255;
  };
  const lo = pct(0.01);
  const hi = pct(0.99);

  const toned = Buffer.alloc(data.length);
  for (let i = 0; i < px; i++) {
    const o = i * 4;
    const l = 0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2];
    const t = Math.pow(Math.min(1, Math.max(0, (l - lo) / (hi - lo))), gamma);
    const [r, g, b] = rampAt(t);
    toned[o] = r;
    toned[o + 1] = g;
    toned[o + 2] = b;
    toned[o + 3] = data[o + 3];
  }

  const webp = { quality: 86, alphaQuality: 90, effort: 6 };
  await sharp(trimmed).webp(webp).toFile(path.join(OUT_DIR, `${out}-color.webp`));
  await sharp(toned, { raw: { width: info.width, height: info.height, channels: 4 } })
    .webp(webp)
    .toFile(path.join(OUT_DIR, `${out}-tone.webp`));

  console.log(`${out}: ${info.width}x${info.height}, levels ${lo}–${hi}`);
}

await mkdir(OUT_DIR, { recursive: true });
for (const p of PORTRAITS) await bake(p);

// the contact-card avatar is a square crop of the true-colour hero portrait
await sharp(path.join(OUT_DIR, "hero-color.webp"))
  .extract({ left: 0, top: 110, width: 600, height: 600 })
  .flatten({ background: "#2b3bff" })
  .resize(192, 192)
  .webp({ quality: 88 })
  .toFile(path.join(OUT_DIR, "avatar.webp"));

// next/og cannot read WebP, so the share image gets a small PNG of its own
await sharp(path.join(OUT_DIR, "hero-tone.webp"))
  .resize({ height: 630 })
  .png({ compressionLevel: 9 })
  .toFile(path.join(ROOT, "app", "og-portrait.png"));
console.log("ramp:", RAMP.map(([t, c]) => `${t}:${hex(c)}`).join("  "));
