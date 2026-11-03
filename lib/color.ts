/** WCAG relative luminance + contrast helpers (used by the heatmap and the contrast test). */
function channel(c: number) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

export function rgbToHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex([ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t]);
}

/** Cherry sequential scale for 0–max %, with whichever text color (ink/white) contrasts more. */
export function cherryScale(value: number, max = 65): { bg: string; fg: string } {
  const t = Math.max(0, Math.min(1, value / max));
  // Two bands that skip the mid-luminance zone where neither ink nor white text reaches 4.5:1.
  const bg = t < 0.5 ? mix("#FBF3F4", "#E39AAA", t / 0.5) : mix("#B4405A", "#6E1624", (t - 0.5) / 0.5);
  const fg = contrastRatio(bg, "#1A1A1A") >= contrastRatio(bg, "#FFFFFF") ? "#1A1A1A" : "#FFFFFF";
  return { bg, fg };
}
