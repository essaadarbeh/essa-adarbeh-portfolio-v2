// Writes public/portraits/wash.png: a white blob with a ragged watercolour
// edge. The portraits scale it up from the face to paint themselves in, and
// the eraser uses it at a small size. It replaces an SVG turbulence filter,
// which had to be recomputed over the whole painting on every frame.
//
//   node scripts/make-wash.mjs
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const S = 512;

// value noise, a few octaves
const rand = (x, y, seed) => {
  const v = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return v - Math.floor(v);
};
const smooth = (t) => t * t * (3 - 2 * t);
const noise = (x, y, seed) => {
  const xi = Math.floor(x), yi = Math.floor(y), xf = smooth(x - xi), yf = smooth(y - yi);
  const a = rand(xi, yi, seed), b = rand(xi + 1, yi, seed), c = rand(xi, yi + 1, seed), d = rand(xi + 1, yi + 1, seed);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
};
const fbm = (x, y) => {
  let v = 0, amp = 0.5, f = 1;
  for (let o = 0; o < 5; o++) {
    v += amp * noise(x * f, y * f, o * 13.1);
    amp *= 0.5;
    f *= 2.07;
  }
  return v;
};

const out = Buffer.alloc(S * S * 2);
for (let y = 0; y < S; y++) {
  for (let x = 0; x < S; x++) {
    const u = (x / S) * 2 - 1, v = (y / S) * 2 - 1;
    const d = Math.hypot(u, v);
    // the edge wanders in and out, with a few fine tendrils
    const n = fbm(u * 3.2 + 7, v * 3.2 + 3) - 0.5;
    const fine = fbm(u * 11 + 1, v * 11 + 9) - 0.5;
    const e = d + n * 0.42 + fine * 0.09;
    const t = Math.min(1, Math.max(0, (0.93 - e) / 0.07));
    const a = smooth(t);
    const i = (y * S + x) * 2;
    out[i] = 255;
    out[i + 1] = Math.round(a * 255);
  }
}
await sharp(out, { raw: { width: S, height: S, channels: 2 } })
  .png({ compressionLevel: 9 })
  .toFile(path.join(ROOT, "public", "portraits", "wash.png"));
console.log("wash.png written");
