// Traces a painted portrait into pen lines, for the hero's "sketch, then
// paint" moment. Writes data/sketch-<name>.json: { width, height, paths[] }.
//
//   node scripts/trace-portrait.mjs
//
// Two kinds of line, both found with marching squares:
//   - the silhouette, from the image's alpha
//   - contour lines through the (blurred) light and shadow, like the lines
//     an illustrator uses to map where the planes of a face turn
// Each polyline is simplified (Ramer–Douglas–Peucker), short scraps are
// dropped, and the rest is written as smooth quadratic paths, ordered
// roughly the way a hand would draw them: outline first, then top to bottom.
//
// It also writes public/portraits/<name>-ink.webp: the painting as an ink
// drawing, via XDoG (an extended difference of Gaussians, the classic
// photo-to-line-art filter), shaded with pencil hatching where the painting
// is dark. The contour paths double as the brush strokes that reveal this
// ink in the browser.

import sharp from "sharp";
import path from "node:path";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const JOBS = [
  { name: "hero", src: "public/portraits/hero-luma.webp", color: "public/portraits/hero-color.webp", levels: [0.2, 0.36, 0.55, 0.74], blur: 2.2 },
  { name: "about", src: "public/portraits/about-luma.webp", color: "public/portraits/about-color.webp", levels: [0.22, 0.4, 0.6], blur: 2.4, gain: 1.6 },
];
const H = 900; // working height; paths are written in this coordinate space

// ── marching squares ──────────────────────────────────────────────────────
// Returns polylines of points where the field crosses `t`. `valid(x,y)` can
// exclude cells (outside the figure).
function contours(field, w, h, t, valid = () => true) {
  const at = (x, y) => field[y * w + x];
  // edge id → point
  const hPt = (x, y) => {
    const a = at(x, y), b = at(x + 1, y);
    return [x + (t - a) / (b - a), y];
  };
  const vPt = (x, y) => {
    const a = at(x, y), b = at(x, y + 1);
    return [x, y + (t - a) / (b - a)];
  };
  const segs = []; // [edgeKeyA, edgeKeyB, ptA, ptB]
  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w - 1; x++) {
      if (!valid(x, y) || !valid(x + 1, y) || !valid(x, y + 1) || !valid(x + 1, y + 1)) continue;
      const c =
        (at(x, y) > t ? 8 : 0) | (at(x + 1, y) > t ? 4 : 0) | (at(x + 1, y + 1) > t ? 2 : 0) | (at(x, y + 1) > t ? 1 : 0);
      if (c === 0 || c === 15) continue;
      const T = [`h${x},${y}`, () => hPt(x, y)];
      const B = [`h${x},${y + 1}`, () => hPt(x, y + 1)];
      const L = [`v${x},${y}`, () => vPt(x, y)];
      const R = [`v${x + 1},${y}`, () => vPt(x + 1, y)];
      const pairs = {
        1: [[L, B]], 2: [[B, R]], 3: [[L, R]], 4: [[T, R]], 5: [[L, T], [B, R]], 6: [[T, B]], 7: [[L, T]],
        8: [[L, T]], 9: [[T, B]], 10: [[T, R], [L, B]], 11: [[T, R]], 12: [[L, R]], 13: [[B, R]], 14: [[L, B]],
      }[c];
      for (const [a, b] of pairs) segs.push([a[0], b[0], a[1](), b[1]()]);
    }
  }
  // link segments that share an edge into polylines
  const byEdge = new Map();
  segs.forEach((s, i) => {
    for (const k of [s[0], s[1]]) (byEdge.get(k) ?? byEdge.set(k, []).get(k)).push(i);
  });
  const used = new Uint8Array(segs.length);
  const lines = [];
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue;
    used[i] = 1;
    const line = [segs[i][2], segs[i][3]];
    for (const dir of [1, 0]) {
      let key = dir ? segs[i][1] : segs[i][0];
      for (;;) {
        const next = (byEdge.get(key) ?? []).find((j) => !used[j]);
        if (next === undefined) break;
        used[next] = 1;
        const s = segs[next];
        const [pt, other] = s[0] === key ? [s[3], s[1]] : [s[2], s[0]];
        if (dir) line.push(pt);
        else line.unshift(pt);
        key = other;
      }
    }
    lines.push(line);
  }
  return lines;
}

// ── simplify + smooth ─────────────────────────────────────────────────────
function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
  let max = 0, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / len;
    if (d > max) (max = d), (idx = i);
  }
  if (max <= eps) return [pts[0], pts[pts.length - 1]];
  return [...rdp(pts.slice(0, idx + 1), eps).slice(0, -1), ...rdp(pts.slice(idx), eps)];
}
const length = (pts) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
const f = (n) => Math.round(n * 10) / 10;
function toPath(pts) {
  if (pts.length < 3) return `M${f(pts[0][0])} ${f(pts[0][1])}L${f(pts[1][0])} ${f(pts[1][1])}`;
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += `Q${f(pts[i][0])} ${f(pts[i][1])} ${f(mx)} ${f(my)}`;
  }
  const last = pts[pts.length - 1];
  return d + `L${f(last[0])} ${f(last[1])}`;
}

// ── XDoG ink ─────────────────────────────────────────────────────────────
async function ink(job) {
  const INK_H = 1300;
  const sigma = 1.4, k = 1.6, tau = 0.98, eps = -0.005, phi = 40;
  const src = path.join(ROOT, job.color);
  const { data: a, info } = await sharp(src).resize({ height: INK_H }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  // dark paintings (the back view) get their levels lifted first
  const grey = (b) =>
    sharp(src)
      .resize({ height: INK_H })
      .flatten({ background: "#ffffff" })
      .greyscale()
      .linear(job.gain ?? 1, 0)
      .blur(b)
      .raw()
      .toBuffer();
  const [g1, g2, tone] = await Promise.all([grey(sigma), grey(sigma * k), grey(7)]);
  const W = info.width;
  const n = W * info.height;
  const out = Buffer.alloc(n * 4);
  // pencil hatching, only in the deepest shadows (thresholds are percentiles
  // of this painting's own darkness), drawn as short broken strokes the way a
  // hand hatches, one direction first, crossed only where it's darkest.
  const inside = [];
  for (let i = 0; i < n; i += 7) if (a[i * 4 + 3] > 240) inside.push(1 - tone[i] / 255);
  inside.sort((p, q) => p - q);
  const pct = (q) => inside[Math.floor(q * (inside.length - 1))];
  const [t1, t2, t3] = [pct(0.62), pct(0.8), pct(0.93)];
  const hash = (i, j) => {
    const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
    return v - Math.floor(v);
  };
  const ramp = (x, a0, a1) => Math.max(0, Math.min(1, (x - a0) / (a1 - a0)));
  const hatch = (u, v, spacing, seg, seed) => {
    const row = Math.floor(u / spacing);
    const f = u - row * spacing - spacing / 2;
    const pos = (v + hash(row, seed) * seg) / seg;
    const cell = Math.floor(pos);
    const on = hash(row, cell + seed) > 0.3; // gaps between strokes
    const taper = Math.sin(Math.PI * (pos - cell)); // strokes thin at the ends
    return on ? Math.max(0, 1 - Math.abs(f) / (0.6 + taper * 0.8)) : 0;
  };
  for (let i = 0; i < n; i++) {
    const x = i % W, y = (i / W) | 0;
    const d = g1[i] / 255 - tau * (g2[i] / 255);
    const e = d >= eps ? 1 : 1 + Math.tanh(phi * (d - eps));
    const line = Math.max(0, Math.min(1, 1 - e));
    const dark = 1 - tone[i] / 255;
    const wob = Math.sin(y / 41) * 1.4;
    const h1 = hatch(x + y + wob, x - y, 8, 46, 1) * ramp(dark, t1, t2) * 0.5;
    const h2 = hatch(x - y + wob, x + y, 9, 38, 7) * ramp(dark, t2, t3) * 0.38;
    const v = Math.max(line, h1, h2) * (a[i * 4 + 3] / 255);
    out.set([11, 18, 56, Math.round(v * 255)], i * 4);
  }
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .webp({ quality: 82, alphaQuality: 80 })
    .toFile(path.join(ROOT, "public", "portraits", `${job.name}-ink.webp`));
}

for (const job of JOBS) {
  await ink(job);
  const img = sharp(path.join(ROOT, job.src)).resize({ height: H });
  const { data, info } = await img.clone().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const blurred = await img.clone().blur(job.blur).ensureAlpha().raw().toBuffer();
  const { width: w, height: h } = info;
  const alpha = new Float32Array(w * h);
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    alpha[i] = data[i * 4 + 3] / 255;
    lum[i] = blurred[i * 4] / 255;
  }

  const out = [];
  // silhouette (drop tiny islands)
  for (const line of contours(alpha, w, h, 0.5)) {
    if (length(line) < 120) continue;
    out.push({ kind: "outline", pts: rdp(line, 1.1) });
  }
  // light-and-shadow contours, only well inside the figure
  const inside = (x, y) => alpha[y * w + x] > 0.95;
  for (const t of job.levels) {
    for (const line of contours(lum, w, h, t, inside)) {
      if (length(line) < 45) continue;
      out.push({ kind: "form", level: t, pts: rdp(line, 1.4) });
    }
  }
  // outline first, then forms from the top down (how a hand works)
  out.sort((a, b) =>
    a.kind !== b.kind ? (a.kind === "outline" ? -1 : 1) : Math.min(...a.pts.map((p) => p[1])) - Math.min(...b.pts.map((p) => p[1])),
  );
  const paths = out.map((o) => ({ d: toPath(o.pts), k: o.kind === "outline" ? 0 : 1 }));
  await writeFile(
    path.join(ROOT, "data", `sketch-${job.name}.json`),
    JSON.stringify({ width: w, height: h, paths }),
  );
  const bytes = JSON.stringify(paths).length;
  console.log(`${job.name}: ${w}x${h}, ${paths.length} paths, ${(bytes / 1024).toFixed(0)} KB`);
}
