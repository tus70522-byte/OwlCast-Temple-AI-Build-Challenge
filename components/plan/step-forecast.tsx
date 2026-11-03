"use client";

import { useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { CalendarPlus, CloudLightning, Flag, HeartHandshake, ListChecks, Pencil, Printer, RotateCcw, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TimelineChart } from "@/components/forecast/timeline-chart";
import { WeekCard } from "@/components/forecast/week-card";
import { TEMPLE_ATTRIBUTION, TEMPLE_CALENDAR_SOURCE } from "@/lib/calendar/temple-calendar";
import { formatRange, formatShort, todayISO } from "@/lib/dates";
import { buildForecast, summarizeForecast } from "@/lib/forecast/forecast";
import { buildIcs } from "@/lib/forecast/ics";
import { recommendStartDates } from "@/lib/forecast/recommend";
import { getSemesterWeeks } from "@/lib/forecast/weeks";
import { toEngineItems } from "@/lib/plan/adapters";
import { usePlanStore, useSemester } from "@/lib/plan/store";
import { SUPPORT_RESOURCES } from "@/lib/support-resources";
import { pluralize } from "@/lib/utils";

export function StepForecast({ onEdit }: { onEdit: () => void }) {
  const items = usePlanStore((s) => s.items);
  const courses = usePlanStore((s) => s.courses);
  const shifts = usePlanStore((s) => s.shifts);
  const includeTemple = usePlanStore((s) => s.includeTemple);
  const semester = useSemester();
  const [today] = useState<string>(() => todayISO());
  const uid = useId();

  const model = useMemo(() => {
    if (!semester) return null;
    const engine = toEngineItems(items, courses);
    const weeks = getSemesterWeeks(semester);
    const forecast = buildForecast(engine, weeks);
    const recs = recommendStartDates(engine, forecast, shifts, semester, today);
    const summary = summarizeForecast(forecast, engine);
    return { engine, forecast, recs, summary, itemsById: new Map(engine.map((i) => [i.id, i])) };
  }, [items, courses, shifts, semester, today]);

  if (!semester || !model) return null;
  const { engine, forecast, recs, summary, itemsById } = model;

  const nextRec = recs.find((r) => r.startDate === "now" || r.startDate >= today);
  const withdraw = semester.deadlines.find((d) => /withdraw/i.test(d.label));
  const showSupport = Boolean(withdraw && summary.stormWeeks.some((w) => w.week.start < withdraw.date));

  const downloadIcs = () => {
    try {
      const ics = buildIcs(engine, recs, semester, includeTemple, today);
      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `owlcast-${semester.label.toLowerCase().replace(/\s+/g, "-")}.ics`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Calendar file downloaded", { description: "Open it to add your dates to Google, Apple, or Outlook Calendar." });
      usePlanStore.getState().announce("Calendar file downloaded.");
    } catch {
      toast.error("We couldn't build the calendar file. Try again.");
    }
  };

  const startOver = () => {
    usePlanStore.getState().reset();
    toast("Started over. Your previous plan was cleared.");
  };

  const stormAhead = (i: number) => forecast.slice(i + 1, i + 3).find((x) => x.rating === "storm")?.week.weekNumber;

  return (
    <div>
      <p className="print-only mb-2 text-sm">OwlCast · The forecast for your semester</p>
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 id="step-heading" tabIndex={-1} className="font-display text-[2rem] leading-tight font-semibold tracking-tight outline-none sm:text-[2.6rem]">
            Your {semester.isTemple ? semester.label : "semester"} forecast
          </h2>
          <p className="mt-2 max-w-2xl text-lg text-ink-muted">
            Every week rated by how much of your grade is due, with start dates for the big items.
          </p>
        </div>
        <div className="no-print flex flex-wrap gap-3">
          <Button variant="secondary" onClick={onEdit}>
            <Pencil className="size-4.5" aria-hidden="true" />
            Edit items
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost">
                <RotateCcw className="size-4.5" aria-hidden="true" />
                Start over
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>Start over?</AlertDialogTitle>
              <AlertDialogDescription>
                This clears your syllabi, items, and forecast from this browser. You can&rsquo;t undo this.
              </AlertDialogDescription>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep my forecast</AlertDialogCancel>
                <AlertDialogAction onClick={startOver}>Start over</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Summary strip */}
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <SummaryTile Icon={CloudLightning} tone="storm" label="Storm weeks">
          <span className="font-display text-3xl font-semibold tabular sm:text-4xl">{summary.stormWeeks.length}</span>
          <span className="mt-1 block text-[15px] text-ink-muted">
            {summary.stormWeeks.length ? summary.stormWeeks.map((w) => `Week ${w.week.weekNumber}`).join(", ") : "None. Nice."}
          </span>
        </SummaryTile>
        <SummaryTile Icon={Scale} label="Heaviest week">
          {summary.heaviest ? (
            <>
              <span className="font-display text-3xl font-semibold tabular sm:text-4xl">Week {summary.heaviest.week.weekNumber}</span>
              <span className="mt-1 block text-[15px] text-ink-muted tabular">
                {formatRange(summary.heaviest.week.start, summary.heaviest.week.end)} · load {summary.heaviest.load}
              </span>
            </>
          ) : (
            <span className="text-lg text-ink-muted">Nothing dated yet</span>
          )}
        </SummaryTile>
        <SummaryTile Icon={ListChecks} label="Total items">
          <span className="font-display text-3xl font-semibold tabular sm:text-4xl">{summary.totalItems}</span>
          <span className="mt-1 block text-[15px] text-ink-muted tabular">
            {summary.datedItems} in the forecast · {pluralize(courses.length, "course")}
          </span>
        </SummaryTile>
        <SummaryTile Icon={Flag} label="Next start date">
          {nextRec ? (
            <>
              <span className="font-display text-2xl leading-tight font-semibold tabular sm:text-[1.75rem]">
                {nextRec.startDate === "now" ? "Start now" : formatShort(nextRec.startDate)}
              </span>
              <span className="mt-1 block text-[15px] text-ink-muted">
                {itemsById.get(nextRec.itemId)?.courseLabel} {itemsById.get(nextRec.itemId)?.title}
              </span>
            </>
          ) : (
            <span className="text-lg text-ink-muted">No big items ahead</span>
          )}
        </SummaryTile>
      </dl>

      {showSupport && (
        <section aria-labelledby={`${uid}-support`} className="card mt-6 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-clear-bg text-clear-fg">
              <HeartHandshake className="size-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h3 id={`${uid}-support`} className="text-xl font-semibold">
                Heavy weeks ahead? Talking to someone early helps.
              </h3>
              <p className="mt-1 text-ink-muted">
                Your Storm week comes before the last day to withdraw ({formatShort(withdraw!.date)}). Temple has people whose job is to help
                you plan around weeks like this.
              </p>
            </div>
          </div>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {SUPPORT_RESOURCES.map((r) => (
              <li key={r.name}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-full rounded-xl border border-line p-4 transition-colors hover:border-ink-muted hover:bg-canvas"
                >
                  <span className="block font-semibold text-cherry underline-offset-2 hover:underline">{r.name}</span>
                  <span className="mt-0.5 block text-[15px] text-ink-muted">{r.description}</span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Actions */}
      <div className="no-print card mt-6 flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <Button size="lg" onClick={downloadIcs}>
            <CalendarPlus className="size-5" aria-hidden="true" />
            Add to calendar (.ics)
          </Button>
          <div className="flex items-center gap-3">
            <Checkbox
              id={`${uid}-temple`}
              checked={includeTemple}
              onCheckedChange={(v) => usePlanStore.getState().setIncludeTemple(v === true)}
            />
            <label htmlFor={`${uid}-temple`} className="font-medium">
              Include Temple breaks and deadlines
            </label>
          </div>
        </div>
        <Button variant="secondary" size="lg" onClick={() => window.print()}>
          <Printer className="size-5" aria-hidden="true" />
          Print / Save as PDF
        </Button>
      </div>

      <div className="mt-8">
        <TimelineChart forecast={forecast} today={today} />
      </div>

      <h3 className="mt-12 mb-4 text-2xl font-semibold">Every week</h3>
      <ol className="flex flex-col gap-4">
        {forecast.map((f, i) => (
          <motion.li
            key={f.week.weekNumber}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: Math.min(i * 0.03, 0.25), ease: "easeOut" }}
          >
            <WeekCard
              f={f}
              recs={recs.filter((r) => r.dueWeek === f.week.weekNumber)}
              itemsById={itemsById}
              aheadOf={f.rating === "clear" ? stormAhead(i) : undefined}
            />
          </motion.li>
        ))}
      </ol>

      <div className="mt-10 rounded-2xl border border-line bg-surface p-5 text-[15px] text-ink-muted sm:p-6">
        <p className="font-medium text-ink">
          This forecast is an estimate based on grade weights. Always check your syllabus and Canvas for official dates.
        </p>
        {semester.isTemple && (
          <p className="mt-2">
            {TEMPLE_ATTRIBUTION}{" "}
            <a href={TEMPLE_CALENDAR_SOURCE.url} target="_blank" rel="noopener noreferrer" className="font-medium text-cherry underline underline-offset-2">
              Registrar&rsquo;s academic calendar
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        )}
      </div>
    </div>
  );
}

function SummaryTile({
  Icon,
  label,
  tone,
  children,
}: {
  Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  tone?: "storm";
  children: React.ReactNode;
}) {
  return (
    <div className={tone === "storm" ? "card border-cherry/40 bg-cherry-light p-4 sm:p-5" : "card p-4 sm:p-5"}>
      <dt className="flex items-center gap-2 text-[15px] font-semibold text-ink-muted">
        <Icon className={tone === "storm" ? "size-4.5 text-cherry" : "size-4.5"} aria-hidden={true} />
        {label}
      </dt>
      <dd className="mt-2">{children}</dd>
    </div>
  );
}
