"use client";

import { useId, useState } from "react";
import { ArrowRight, BriefcaseBusiness, CalendarRange, Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, StepHeader, inputClass, selectClass } from "@/components/ui/field";
import { TEMPLE_ATTRIBUTION, TEMPLE_CALENDAR_SOURCE, TEMPLE_SEMESTERS } from "@/lib/calendar/temple-calendar";
import { DAY_NAMES, formatMonthDay, isValidISODate } from "@/lib/dates";
import { usePlanStore, type SemesterChoice } from "@/lib/plan/store";
import { cn } from "@/lib/utils";
import { StepNav } from "./step-nav";

const DAY_LABEL: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

function rangeLabel(id: "spring-2027" | "fall-2026") {
  const s = TEMPLE_SEMESTERS[id];
  return `${formatMonthDay(s.classesBegin)} – ${formatMonthDay(s.semesterEnd)}, ${s.semesterEnd.slice(0, 4)}`;
}

const OPTIONS: { id: SemesterChoice; title: string; detail: string; tag?: string }[] = [
  { id: "spring-2027", title: "Spring 2027", detail: rangeLabel("spring-2027"), tag: "Upcoming" },
  { id: "fall-2026", title: "Fall 2026", detail: rangeLabel("fall-2026") },
  { id: "custom", title: "Custom dates", detail: "Summer, another school, or a different term" },
];

export function StepSetup({ onNext }: { onNext: () => void }) {
  const s = usePlanStore();
  const [attempted, setAttempted] = useState(false);
  const uid = useId();

  const startErr =
    s.semesterChoice === "custom" && (attempted || s.customStart) && !isValidISODate(s.customStart)
      ? "Enter the first day of classes."
      : undefined;
  const endErr =
    s.semesterChoice === "custom" && (attempted || s.customEnd)
      ? !isValidISODate(s.customEnd)
        ? "Enter the last day of the semester."
        : isValidISODate(s.customStart) && s.customEnd <= s.customStart
          ? "The end date must be after the start date."
          : undefined
      : undefined;

  const shiftErrors = new Map(
    s.shifts.map((sh) => [sh.id, !sh.start || !sh.end ? "Add a start and end time." : sh.start === sh.end ? "Start and end can't be the same." : undefined]),
  );
  const valid =
    (s.semesterChoice !== "custom" ||
      (isValidISODate(s.customStart) && isValidISODate(s.customEnd) && s.customEnd > s.customStart)) &&
    [...shiftErrors.values()].every((e) => !e);

  const next = () => {
    setAttempted(true);
    if (valid) onNext();
    else requestAnimationFrame(() => (document.querySelector("[aria-invalid=true]") as HTMLElement | null)?.focus());
  };

  return (
    <div>
      <StepHeader id="step-heading" title="Set up your semester" description="Pick your semester so we can line up every week with Temple's calendar." />

      <fieldset>
        <legend className="mb-4 text-xl font-semibold">Semester</legend>
        <div className="grid gap-4 md:grid-cols-3">
          {OPTIONS.map((o) => {
            const checked = s.semesterChoice === o.id;
            return (
              <label
                key={o.id}
                className={cn(
                  "card relative flex min-h-36 cursor-pointer flex-col p-5 transition-[border-color,box-shadow] has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-cherry",
                  checked ? "border-2 border-cherry shadow-lift" : "hover:border-line-strong",
                )}
              >
                <input
                  type="radio"
                  name="semester"
                  value={o.id}
                  checked={checked}
                  onChange={() => s.setSemesterChoice(o.id)}
                  className="sr-only"
                />
                <span className="flex items-start justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <span className="font-display text-2xl font-semibold">{o.title}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border-2",
                      checked ? "border-cherry bg-cherry text-white" : "border-line-strong bg-surface",
                    )}
                  >
                    {checked && <Check className="size-4" strokeWidth={3} />}
                  </span>
                </span>
                <span className="mt-2 text-ink-muted tabular">{o.detail}</span>
                {o.tag && (
                  <span className="mt-auto pt-4">
                    <span className="inline-flex rounded-full bg-cherry-light px-2.5 py-0.5 text-sm font-semibold text-cherry-dark">{o.tag}</span>
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      {s.semesterChoice === "custom" ? (
        <div className="card mt-6 grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <div>
            <label htmlFor={`${uid}-start`} className="mb-1.5 block font-semibold">
              First day of classes
            </label>
            <input
              id={`${uid}-start`}
              type="date"
              required
              className={inputClass}
              value={s.customStart}
              onChange={(e) => s.setCustomDates(e.target.value, s.customEnd)}
              aria-invalid={Boolean(startErr)}
              aria-describedby={startErr ? `${uid}-start-err` : undefined}
            />
            <FieldError id={`${uid}-start-err`}>{startErr}</FieldError>
          </div>
          <div>
            <label htmlFor={`${uid}-end`} className="mb-1.5 block font-semibold">
              Last day of the semester
            </label>
            <input
              id={`${uid}-end`}
              type="date"
              required
              className={inputClass}
              value={s.customEnd}
              onChange={(e) => s.setCustomDates(s.customStart, e.target.value)}
              aria-invalid={Boolean(endErr)}
              aria-describedby={endErr ? `${uid}-end-err` : undefined}
            />
            <FieldError id={`${uid}-end-err`}>{endErr}</FieldError>
          </div>
        </div>
      ) : (
        <p className="mt-5 flex items-start gap-2 text-[15px] text-ink-muted">
          <CalendarRange className="mt-0.5 size-5 shrink-0 text-ink" aria-hidden="true" />
          <span>
            Dates from Temple&rsquo;s official academic calendar.{" "}
            <a href={TEMPLE_CALENDAR_SOURCE.url} target="_blank" rel="noopener noreferrer" className="font-medium text-cherry underline underline-offset-2">
              View the registrar&rsquo;s calendar
            </a>
            <span className="sr-only"> (opens in a new tab)</span>
            <span className="mt-1 block text-sm">{TEMPLE_ATTRIBUTION}</span>
          </span>
        </p>
      )}

      <section aria-labelledby={`${uid}-shifts`} className="mt-12">
        <div className="flex items-center gap-2.5">
          <BriefcaseBusiness className="size-6 text-cherry" aria-hidden="true" />
          <h3 id={`${uid}-shifts`} className="text-xl font-semibold">
            Work shifts and fixed commitments <span className="font-normal text-ink-muted">(optional)</span>
          </h3>
        </div>
        <p className="mt-1.5 text-ink-muted" id={`${uid}-shifts-help`}>
          We&rsquo;ll avoid suggesting start dates on your busiest days.
        </p>

        {s.shifts.length > 0 && (
          <ul className="mt-5 flex flex-col gap-3">
            {s.shifts.map((sh, i) => {
              const err = attempted ? shiftErrors.get(sh.id) : undefined;
              const base = `${uid}-shift-${i}`;
              return (
                <li key={sh.id} className="card p-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1.1fr_1fr_1fr_1.6fr_auto] sm:items-end">
                    <div className="col-span-2 sm:col-span-1">
                      <label htmlFor={`${base}-day`} className="mb-1 block text-[15px] font-semibold">
                        Day
                      </label>
                      <select
                        id={`${base}-day`}
                        className={selectClass}
                        value={sh.day}
                        onChange={(e) => s.updateShift(sh.id, { day: e.target.value as (typeof DAY_NAMES)[number] })}
                      >
                        {DAY_NAMES.map((d) => (
                          <option key={d} value={d}>
                            {DAY_LABEL[d]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor={`${base}-start`} className="mb-1 block text-[15px] font-semibold">
                        Start
                      </label>
                      <input
                        id={`${base}-start`}
                        type="time"
                        className={inputClass}
                        value={sh.start}
                        onChange={(e) => s.updateShift(sh.id, { start: e.target.value })}
                        aria-invalid={Boolean(err)}
                        aria-describedby={err ? `${base}-err` : undefined}
                      />
                    </div>
                    <div>
                      <label htmlFor={`${base}-end`} className="mb-1 block text-[15px] font-semibold">
                        End
                      </label>
                      <input
                        id={`${base}-end`}
                        type="time"
                        className={inputClass}
                        value={sh.end}
                        onChange={(e) => s.updateShift(sh.id, { end: e.target.value })}
                        aria-invalid={Boolean(err)}
                        aria-describedby={err ? `${base}-err` : undefined}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label htmlFor={`${base}-label`} className="mb-1 block text-[15px] font-semibold">
                        Label
                      </label>
                      <input
                        id={`${base}-label`}
                        type="text"
                        className={inputClass}
                        placeholder="e.g. Work at the library"
                        value={sh.label}
                        maxLength={60}
                        onChange={(e) => s.updateShift(sh.id, { label: e.target.value })}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="col-span-2 justify-self-end sm:col-span-1"
                      onClick={() => s.removeShift(sh.id)}
                      aria-label={`Remove ${DAY_LABEL[sh.day]} shift${sh.label ? ` (${sh.label})` : ""}`}
                    >
                      <Trash2 className="size-5" aria-hidden="true" />
                    </Button>
                  </div>
                  <FieldError id={`${base}-err`}>{err}</FieldError>
                </li>
              );
            })}
          </ul>
        )}
        <Button variant="secondary" className="mt-4" onClick={s.addShift} aria-describedby={`${uid}-shifts-help`}>
          <Plus className="size-5" aria-hidden="true" />
          Add a shift
        </Button>
      </section>

      <StepNav>
        <Button size="lg" onClick={next}>
          Continue to upload
          <ArrowRight className="size-5" aria-hidden="true" />
        </Button>
      </StepNav>
    </div>
  );
}
