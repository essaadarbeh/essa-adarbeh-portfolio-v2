// Contrast check for every palette pairing the site actually uses as text.
//   node scripts/check-palettes.mjs
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../lib/palettes.ts", import.meta.url), "utf8");
const blocks = [...src.matchAll(/\{\s*id: "([^"]+)"[\s\S]*?\}/g)].map((m) => {
  const get = (k) => m[0].match(new RegExp(`${k}: "(#[0-9a-f]{6})"`))[1];
  return { id: m[1], ...Object.fromEntries(["ink", "field", "sky", "chalk", "signal", "inkMuted", "chalkMuted", "fieldMuted"].map((k) => [k, get(k)])) };
});

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

const pairs = [
  ["chalk", "field", 4.5],
  ["fieldMuted", "field", 4.5],
  ["ink", "chalk", 4.5],
  ["inkMuted", "chalk", 4.5],
  ["chalk", "ink", 4.5],
  ["chalkMuted", "ink", 4.5],
  ["ink", "signal", 4.5],
  ["sky", "ink", 4.5],
  ["field", "chalk", 3],
];
let failed = 0;
for (const p of blocks) {
  const row = pairs.map(([fg, bg, min]) => {
    const r = ratio(p[fg], p[bg]);
    if (r < min) failed++;
    return `${fg}/${bg} ${r.toFixed(2)}${r < min ? " ✗" : ""}`;
  });
  console.log(p.id.padEnd(9), row.join("  "));
}
process.exit(failed ? 1 : 0);
