/**
 * Five palettes, all taken from Jordan. Every one fills the same roles, so a
 * component never knows which palette is active:
 *
 *   ink    darkest surface, text on light
 *   field  the big colour field (hero, contact), primary actions
 *   sky    light accent, hover on dark
 *   chalk  paper, text on dark
 *   signal state only: availability, focus, the lens rim, cursor labels
 *
 * The *Muted values are text colours tuned to pass 4.5:1 on their surface
 * (checked by scripts/check-palettes.mjs).
 */
export type Palette = {
  id: string;
  name: string;
  ink: string;
  field: string;
  sky: string;
  chalk: string;
  signal: string;
  inkMuted: string;
  chalkMuted: string;
  fieldMuted: string;
};

export const palettes: Palette[] = [
  {
    id: "cobalt",
    name: "Cobalt",
    ink: "#0b1238",
    field: "#2b3bff",
    sky: "#a9b8ff",
    chalk: "#eef0f6",
    signal: "#ffc24b",
    inkMuted: "#4a5070",
    chalkMuted: "#9aa3c7",
    fieldMuted: "#d6dbff",
  },
  {
    id: "petra",
    name: "Petra",
    ink: "#2a0c14",
    field: "#a8283a",
    sky: "#f4afa6",
    chalk: "#fbf0ec",
    signal: "#ffd08a",
    inkMuted: "#6b4148",
    chalkMuted: "#c79aa0",
    fieldMuted: "#ffd9d3",
  },
  {
    id: "dead-sea",
    name: "Dead Sea",
    ink: "#04221f",
    field: "#0a6e60",
    sky: "#8fdcc9",
    chalk: "#eef5f2",
    signal: "#ff9463",
    inkMuted: "#3e5a55",
    chalkMuted: "#8db3aa",
    fieldMuted: "#cdefe6",
  },
  {
    id: "wadi-rum",
    name: "Wadi Rum",
    ink: "#170a2e",
    field: "#5a2fd8",
    sky: "#c8b6ff",
    chalk: "#f3f0fa",
    signal: "#ff9a4d",
    inkMuted: "#564a6e",
    chalkMuted: "#a99cc9",
    fieldMuted: "#e1d8ff",
  },
  {
    id: "olive",
    name: "Olive",
    ink: "#171a0b",
    field: "#4a5a17",
    sky: "#d5e19a",
    chalk: "#f4f3ea",
    signal: "#ff7a5c",
    inkMuted: "#555a43",
    chalkMuted: "#a9ae8e",
    fieldMuted: "#e3ebc1",
  },
];

export const DEFAULT_PALETTE = palettes[0];
export const PALETTE_EVENT = "palette:change";
export const PALETTE_STORAGE_KEY = "ea-palette";

export const getPalette = (id: string | undefined | null) => palettes.find((p) => p.id === id) ?? DEFAULT_PALETTE;

/** CSS custom properties for every palette, keyed by [data-palette]. */
export function paletteCss() {
  const block = (p: Palette) =>
    `--p-ink:${p.ink};--p-field:${p.field};--p-sky:${p.sky};--p-chalk:${p.chalk};--p-signal:${p.signal};` +
    `--p-ink-muted:${p.inkMuted};--p-chalk-muted:${p.chalkMuted};--p-field-muted:${p.fieldMuted};`;
  return (
    `:root{${block(DEFAULT_PALETTE)}}` + palettes.map((p) => `:root[data-palette="${p.id}"]{${block(p)}}`).join("")
  );
}

// ── colour maths for the portrait ramp ─────────────────────────────────────

type RGB = [number, number, number];
export const hexToRgb = (hex: string): RGB => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a: RGB, b: RGB, t: number): RGB => [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * t) as RGB;

/**
 * Gradient-map stops for the portrait: luminance 0–1 → palette colour.
 * Shadows sink below ink so the figure separates from the field; highlights
 * stop just short of white.
 */
export function portraitRamp(p: Palette): [number, RGB][] {
  const ink = hexToRgb(p.ink);
  const field = hexToRgb(p.field);
  const sky = hexToRgb(p.sky);
  const chalk = hexToRgb(p.chalk);
  return [
    [0, mix(ink, [0, 0, 0], 0.55)],
    [0.18, ink],
    [0.42, mix(ink, field, 0.85)],
    [0.58, mix(field, sky, 0.25)],
    [0.76, sky],
    [0.9, mix(sky, chalk, 0.6)],
    [1, mix(chalk, [255, 255, 255], 0.5)],
  ];
}

/** 256×1 RGBA bytes of the ramp, for a lookup texture. */
export function rampBytes(p: Palette) {
  const stops = portraitRamp(p);
  const out = new Uint8Array(256 * 4);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let k = 1;
    while (k < stops.length - 1 && t > stops[k][0]) k++;
    const [t0, c0] = stops[k - 1];
    const [t1, c1] = stops[k];
    const c = mix(c0, c1, Math.min(1, Math.max(0, (t - t0) / (t1 - t0))));
    out.set([Math.round(c[0]), Math.round(c[1]), Math.round(c[2]), 255], i * 4);
  }
  return out;
}
