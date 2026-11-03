"use client";

import { motion } from "motion/react";
import { CloudLightning, GraduationCap, Palmtree } from "lucide-react";
import { diffDays, formatRange, type ISODate } from "@/lib/dates";
import { BUSY_THRESHOLD, STORM_THRESHOLD } from "@/lib/forecast/config";
import type { WeekForecast } from "@/lib/forecast/types";
import { RATING_META } from "./rating-badge";

const W = 1000;
const H = 300;
const PAD = { left: 44, right: 12, top: 46, bottom: 58 };

/** Horizontal week-by-week bar chart (SVG, no chart library) with a hidden table alternative. */
export function TimelineChart({ forecast, today }: { forecast: WeekForecast[]; today: ISODate }) {
  const n = forecast.length;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const col = plotW / n;
  const barW = Math.min(40, col * 0.62);
  const maxLoad = Math.max(STORM_THRESHOLD + 10, ...forecast.map((f) => f.load));
  const y = (v: number) => PAD.top + plotH - (v / maxLoad) * plotH;
  const first = forecast[0]?.week.start;
  const last = forecast[n - 1]?.week.end;
  const todayX =
    first && last && today >= first && today <= last ? PAD.left + (diffDays(first, today) / (diffDays(first, last) + 1)) * plotW : null;

  return (
    <figure className="card p-4 sm:p-6">
      <figcaption className="mb-2 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <span className="text-xl font-semibold">Week by week</span>
        <span className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted" aria-hidden="true">
          {(["clear", "busy", "storm", "break"] as const).map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-sm" style={{ backgroundColor: RATING_META[k].bar }} />
              {RATING_META[k].label}
            </span>
          ))}
        </span>
      </figcaption>
      <div
        className="-mx-1 overflow-x-auto px-1 pb-1"
        tabIndex={0}
        role="group"
        aria-label="Forecast chart. The same data is in the table that follows."
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full min-w-[680px]" aria-hidden="true">
          {/* threshold guides */}
          {[
            { v: BUSY_THRESHOLD, label: "Busy" },
            { v: STORM_THRESHOLD, label: "Storm" },
          ].map((t) => (
            <g key={t.label}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t.v)} y2={y(t.v)} stroke="#C9C9CF" strokeDasharray="4 6" />
              <text x={PAD.left - 8} y={y(t.v) + 5} textAnchor="end" fontSize="14" fill="#55565A">
                {t.v}
              </text>
            </g>
          ))}
          <line x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} stroke="#C9C9CF" />

          {forecast.map((f, i) => {
            const cx = PAD.left + col * i + col / 2;
            const meta = RATING_META[f.rating];
            const isBreak = f.rating === "break";
            const h = isBreak ? plotH : Math.max(f.load > 0 ? 4 : 2, y(0) - y(f.load));
            const top = y(0) - h;
            return (
              <a key={f.week.weekNumber} href={`#week-${f.week.weekNumber}`} tabIndex={-1}>
                <title>{`Week ${f.week.weekNumber}: ${meta.label}`}</title>
                <rect x={cx - col / 2} y={PAD.top - 30} width={col} height={plotH + 30} fill="transparent" className="cursor-pointer" />
                {isBreak ? (
                  <rect x={cx - barW / 2} y={top} width={barW} height={h} rx={6} fill="#EEF1F5" stroke="#AEB8C6" strokeDasharray="3 4" />
                ) : (
                  <motion.rect
                    x={cx - barW / 2}
                    width={barW}
                    rx={6}
                    fill={meta.bar}
                    initial={{ height: 0, y: y(0) }}
                    animate={{ height: h, y: top }}
                    transition={{ duration: 0.25, delay: i * 0.015, ease: "easeOut" }}
                  />
                )}
                {isBreak && <Palmtree x={cx - 11} y={PAD.top + plotH / 2 - 11} width={22} height={22} color="#3F4A5A" />}
                {f.rating === "storm" && <CloudLightning x={cx - 13} y={top - 32} width={26} height={26} color="#9D2235" strokeWidth={2.25} />}
                <text x={cx} y={H - PAD.bottom + 24} textAnchor="middle" fontSize="16" fontWeight={f.rating === "storm" ? 700 : 500} fill="#1A1A1A">
                  {f.week.weekNumber}
                </text>
                {f.hasFinals && <GraduationCap x={cx - 10} y={H - PAD.bottom + 32} width={20} height={20} color="#7A1A29" />}
              </a>
            );
          })}

          {todayX !== null && (
            <g>
              <line x1={todayX} x2={todayX} y1={PAD.top - 20} y2={y(0)} stroke="#1A1A1A" strokeWidth={2} />
              <text x={todayX + 6} y={PAD.top - 24} fontSize="14" fontWeight={600} fill="#1A1A1A">
                Today
              </text>
            </g>
          )}
          <text x={PAD.left} y={H - 4} fontSize="14" fill="#55565A">
            Week
          </text>
        </svg>
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-muted">
        <GraduationCap className="size-4 text-cherry-dark" aria-hidden="true" /> marks finals weeks. Select a bar to jump to that week.
      </p>

      <div className="sr-only">
      <table>
        <caption>Workload forecast by week</caption>
        <thead>
          <tr>
            <th scope="col">Week</th>
            <th scope="col">Dates</th>
            <th scope="col">Rating</th>
            <th scope="col">Load score</th>
            <th scope="col">Items due</th>
          </tr>
        </thead>
        <tbody>
          {forecast.map((f) => (
            <tr key={f.week.weekNumber}>
              <th scope="row">
                <a href={`#week-${f.week.weekNumber}`}>Week {f.week.weekNumber}</a>
              </th>
              <td>{formatRange(f.week.start, f.week.end)}</td>
              <td>
                {RATING_META[f.rating].label}
                {f.hasFinals ? ", finals week" : ""}
              </td>
              <td>{f.load}</td>
              <td>{f.items.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </figure>
  );
}
