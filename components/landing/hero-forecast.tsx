"use client";

import { motion } from "motion/react";
import { Flag } from "lucide-react";
import { RATING_META, RatingBadge, type BadgeKind } from "@/components/forecast/rating-badge";

const ROWS: { week: string; dates: string; kind: BadgeKind; load: number; detail?: string }[] = [
  { week: "Week 3", dates: "Jan 25–31", kind: "clear", load: 22, detail: "A problem set and a quiz" },
  { week: "Week 4", dates: "Feb 1–7", kind: "busy", load: 52, detail: "Project proposal due" },
  { week: "Weeks 5–6", dates: "Feb 8–21", kind: "clear", load: 26, detail: "Light weeks. Good time to start." },
  { week: "Week 7", dates: "Feb 22–28", kind: "storm", load: 100, detail: "2 midterms + a paper" },
  { week: "Week 8", dates: "Mar 1–7", kind: "break", load: 0, detail: "Spring Break" },
];

/** Illustrative, decorative mini forecast for the landing hero (HTML/CSS + motion). */
export function HeroForecast() {
  return (
    <figure className="card relative overflow-hidden p-5 sm:p-6" aria-labelledby="hero-forecast-caption">
      <figcaption id="hero-forecast-caption" className="mb-4 flex items-baseline justify-between gap-3">
        <span className="font-display text-xl font-semibold text-ink">Spring 2027</span>
        <span className="text-sm text-ink-muted">Example forecast</span>
      </figcaption>
      <ol className="flex flex-col gap-2.5">
        {ROWS.map((row, i) => {
          const meta = RATING_META[row.kind];
          const isStorm = row.kind === "storm";
          return (
            <motion.li
              key={row.week}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: 0.15 + i * 0.12, ease: "easeOut" }}
              className={
                isStorm
                  ? "relative rounded-xl border-2 border-cherry bg-cherry-light/60 p-3.5"
                  : "rounded-xl border border-line bg-surface p-3.5"
              }
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink tabular">{row.week}</p>
                  <p className="text-sm text-ink-muted tabular">{row.dates}</p>
                </div>
                <RatingBadge kind={row.kind} size="sm" />
              </div>
              <div className="mt-2.5 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-canvas" aria-hidden="true">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: meta.bar }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(row.load, row.kind === "break" ? 100 : 4)}%` }}
                    transition={{ duration: 0.25, delay: 0.3 + i * 0.12, ease: "easeOut" }}
                  />
                </div>
              </div>
              {row.detail && (
                <p className={isStorm ? "mt-2 font-semibold text-cherry-dark" : "mt-2 text-sm text-ink-muted"}>
                  {row.detail}
                </p>
              )}
              {isStorm && (
                <motion.p
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, delay: 1.05, ease: "easeOut" }}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-cherry px-3 py-1 text-sm font-semibold text-white"
                >
                  <Flag className="size-3.5" aria-hidden="true" />
                  Start your paper by Feb 12
                </motion.p>
              )}
            </motion.li>
          );
        })}
      </ol>
    </figure>
  );
}
