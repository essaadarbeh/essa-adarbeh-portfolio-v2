// The geometry of the lenses mark on a 64×64 grid, shared by the React
// component and the static icons (favicon, app icon, share image).
export const LENSES = {
  hand: "M18.6 22.2 C 25.6 21.8 30 27 29.6 33.4 C 29.2 40 24 44.4 18 44 C 11.8 43.6 7.8 38.6 8.4 32.4 C 9 26.4 13.4 22.6 19 22.4 C 22 22.3 24.4 23.4 26 24.8",
  ring: { cx: 45.4, cy: 33.2, r: 10.6 },
  bridge: "M29.4 30.4 C 30.6 27.2 33.4 27.2 34.8 30.4",
  templeL: "M8.6 30 L3.6 26.4",
  templeR: "M56 30 L60.6 26.6",
};

/** The mark as a standalone SVG string (for icons and images). */
export function lensesSvg(
  ink: string,
  accent: string,
  { size = 64, background, radius = 14, scale = 1 } = {} as {
    size?: number;
    background?: string;
    radius?: number;
    scale?: number;
  },
) {
  const o = +(32 - 32 * scale).toFixed(2);
  const t = `translate(${o} ${o}) scale(${scale})`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">${
    background ? `<rect width="64" height="64" rx="${radius}" fill="${background}"/>` : ""
  }<g transform="${t}"><path d="${LENSES.hand}" fill="none" stroke="${ink}" stroke-width="3.8" stroke-linecap="round"/><circle cx="${LENSES.ring.cx}" cy="${LENSES.ring.cy}" r="${LENSES.ring.r}" fill="none" stroke="${accent}" stroke-width="4.4"/><path d="${LENSES.bridge}" fill="none" stroke="${ink}" stroke-width="3.4" stroke-linecap="round"/><path d="${LENSES.templeL}" stroke="${ink}" stroke-width="3.4" stroke-linecap="round"/><path d="${LENSES.templeR}" stroke="${accent}" stroke-width="3.4"/></g></svg>`;
}
