import { AlertTriangle, CalendarClock, Flag, GraduationCap, Info, Sparkles } from "lucide-react";
import { formatRange, formatShort } from "@/lib/dates";
import { effectiveWeight } from "@/lib/forecast/forecast";
import type { EngineItem, Recommendation, WeekForecast } from "@/lib/forecast/types";
import { cn } from "@/lib/utils";
import { RatingBadge } from "./rating-badge";
import { TYPE_ICON } from "./item-type-icon";

function weightLabel(i: EngineItem) {
  if (i.weightPercent === null) return `~${effectiveWeight(i)}% est.`;
  return Number.isInteger(i.weightPercent) ? `${i.weightPercent}%` : `${i.weightPercent.toFixed(1)}%`;
}

export function WeekCard({
  f,
  recs,
  itemsById,
  aheadOf,
}: {
  f: WeekForecast;
  recs: Recommendation[];
  itemsById: Map<string, EngineItem>;
  /** A Storm week coming up soon, for "get ahead" nudges on clear weeks. */
  aheadOf?: number;
}) {
  const { week } = f;
  const storm = f.rating === "storm";
  const isBreak = f.rating === "break";
  const showRecs = (f.rating === "busy" || storm) && recs.length > 0;

  return (
    <article
      id={`week-${week.weekNumber}`}
      aria-labelledby={`week-${week.weekNumber}-h`}
      className={cn(
        "card scroll-mt-40 overflow-hidden",
        storm && "border-2 border-cherry shadow-lift",
        isBreak && "bg-break-bg/60",
      )}
    >
      {f.hasFinals && (
        <p className="flex items-center gap-2 bg-finals-bg px-5 py-2 text-[15px] font-semibold text-white sm:px-6">
          <GraduationCap className="size-4.5" aria-hidden="true" />
          Finals
          <span className="font-normal text-white/90">· Final exams this week</span>
        </p>
      )}
      <div className="grid gap-4 p-5 sm:grid-cols-[9.5rem_1fr] sm:gap-6 sm:p-6">
        <header className="flex items-start justify-between gap-3 sm:block">
          <div>
            <h3 id={`week-${week.weekNumber}-h`} className="font-display text-2xl leading-tight font-semibold tabular">
              Week {week.weekNumber}
            </h3>
            <p className="text-ink-muted tabular">{formatRange(week.start, week.end)}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 sm:mt-3 sm:items-start">
            <RatingBadge kind={f.rating} />
            {!isBreak && <span className="text-sm text-ink-muted tabular">Load score {f.load}</span>}
          </div>
        </header>

        <div className="min-w-0">
          {f.items.length > 0 ? (
            <ul className="flex flex-col gap-2.5">
              {f.items.map((i) => {
                const Icon = TYPE_ICON[i.type];
                return (
                  <li key={i.id} className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-canvas text-ink-muted">
                      <Icon className="size-4.5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold leading-snug">
                        <span className="text-ink-muted">{i.courseLabel}:</span> {i.title}
                      </span>
                      <span className="block text-[15px] text-ink-muted tabular">
                        {formatShort(i.dueDate!)} · {i.type} · {weightLabel(i)}
                        {i.heavy && " · heavy for you"}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-ink-muted">
              {isBreak
                ? "No classes. Rest up, or use it to get ahead."
                : aheadOf
                  ? `Nothing due. A good week to get ahead before Week ${aheadOf}.`
                  : "Nothing due this week."}
            </p>
          )}

          {isBreak && f.items.length > 0 && (
            <p className="mt-3 flex items-start gap-2 font-medium text-cherry-dark">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Something is due during a break. Double-check these dates with your instructor.
            </p>
          )}

          {(week.notes.length > 0 || week.deadlines.length > 0 || week.studyDays.length > 0) && !isBreak && (
            <ul className="mt-4 flex flex-col gap-1.5 border-t border-line pt-3 text-[15px]">
              {week.notes.map((n) => (
                <li key={n} className="flex items-start gap-2 text-ink">
                  <Info className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                  {n}
                </li>
              ))}
              {week.studyDays.length > 0 && (
                <li className="flex items-start gap-2 text-ink">
                  <Info className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                  Study days: {week.studyDays.map(formatShort).join(", ")}
                </li>
              )}
              {week.deadlines.map((d) => (
                <li key={d.date + d.label} className="flex items-start gap-2 font-medium text-ink">
                  <CalendarClock className="mt-0.5 size-4 shrink-0 text-cherry" aria-hidden="true" />
                  <span>
                    <span className="tabular">{formatShort(d.date)}</span>: {d.label}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {isBreak && week.notes.length > 0 && <p className="mt-3 text-[15px] font-medium text-break-fg">{week.notes[0]}</p>}

          {showRecs && (
            <div className={cn("mt-4 rounded-xl p-4", storm ? "bg-cherry-light" : "bg-busy-bg")}>
              <p className="flex items-center gap-2 font-semibold">
                <Sparkles className={cn("size-4.5", storm ? "text-cherry" : "text-busy-fg")} aria-hidden="true" />
                Get ahead
              </p>
              <ul className="mt-2 flex flex-col gap-2.5">
                {recs.map((r) => {
                  const item = itemsById.get(r.itemId);
                  if (!item) return null;
                  return (
                    <li key={r.itemId} className="flex items-start gap-2.5">
                      <Flag className="mt-1 size-4 shrink-0 text-cherry-dark" aria-hidden="true" />
                      <span>
                        <span className="block font-semibold">
                          {r.startDate === "now" ? (
                            <>Start {item.courseLabel} {item.title} now</>
                          ) : (
                            <>
                              Start {item.courseLabel} {item.title} by <span className="tabular">{formatShort(r.startDate)}</span>
                            </>
                          )}
                        </span>
                        <span className="block text-[15px] text-ink-muted">{r.reason}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
