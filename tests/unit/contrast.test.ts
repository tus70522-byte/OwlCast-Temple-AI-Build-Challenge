import { describe, expect, it } from "vitest";
import { cherryScale, contrastRatio } from "@/lib/color";
import { RATING_META } from "@/components/forecast/rating-badge";

const WHITE = "#FFFFFF";
const CANVAS = "#FAFAF9";

// [label, foreground, background, minimum ratio]
const PAIRS: [string, string, string, number][] = [
  ["ink on white", "#1A1A1A", WHITE, 4.5],
  ["ink on canvas", "#1A1A1A", CANVAS, 4.5],
  ["ink-muted on white", "#55565A", WHITE, 4.5],
  ["ink-muted on canvas", "#55565A", CANVAS, 4.5],
  ["cherry on white", "#9D2235", WHITE, 4.5],
  ["cherry on canvas", "#9D2235", CANVAS, 4.5],
  ["white on cherry (primary button)", WHITE, "#9D2235", 4.5],
  ["white on cherry-dark", WHITE, "#7A1A29", 4.5],
  ["cherry-dark on cherry-light", "#7A1A29", "#F7E8EA", 4.5],
  ["ink on cherry-light", "#1A1A1A", "#F7E8EA", 4.5],
  ["attention text on attention bg", "#8A4B00", "#FFF8EB", 4.5],
  ["ink-muted on attention bg", "#55565A", "#FFF8EB", 4.5],
  ["busy text on busy bg (weight note)", "#7A4F00", "#FFF3D6", 4.5],
  ["clear text on clear bg", "#1E6B2E", "#E9F5EC", 4.5],
  ["break text on break bg", "#3F4A5A", "#EEF1F5", 4.5],
  ["ink-muted on break bg", "#55565A", "#EEF1F5", 4.5],
];

describe("WCAG AA contrast", () => {
  for (const [label, fg, bg, min] of PAIRS) {
    it(`${label} ≥ ${min}:1`, () => {
      expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(min);
    });
  }
  for (const [kind, meta] of Object.entries(RATING_META)) {
    it(`${kind} rating badge text ≥ 4.5:1`, () => {
      expect(contrastRatio(meta.fg, meta.bg)).toBeGreaterThanOrEqual(4.5);
    });
  }
  it("every heatmap cell value is readable", () => {
    for (let v = 0; v <= 64; v++) {
      const { bg, fg } = cherryScale(v, 64);
      expect(contrastRatio(fg, bg), `value ${v} (${fg} on ${bg})`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
