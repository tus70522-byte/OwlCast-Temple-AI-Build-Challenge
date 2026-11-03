"use client";

import { useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowRight, Check, ChevronDown, CircleCheck, Info, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { StepHeader, inputClass, selectClass } from "@/components/ui/field";
import type { Semester } from "@/lib/calendar/semester";
import { getItemFlags, type ItemFlag } from "@/lib/forecast/flags";
import { ITEM_TYPES, type Course, type PlanItem } from "@/lib/forecast/types";
import { courseLabel } from "@/lib/plan/adapters";
import { usePlanStore, useSemester } from "@/lib/plan/store";
import { cn, pluralize } from "@/lib/utils";
import { StepNav } from "./step-nav";

export const TYPE_LABEL: Record<(typeof ITEM_TYPES)[number], string> = {
  exam: "Exam",
  quiz: "Quiz",
  paper: "Paper",
  project: "Project",
  presentation: "Presentation",
  homework: "Homework",
  lab: "Lab",
  participation: "Participation",
  other: "Other",
};

function fmtPct(n: number) {
  return Number.isInteger(n) ? `${n}%` : `${n.toFixed(1)}%`;
}

export function StepConfirm({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const items = usePlanStore((s) => s.items);
  const rawCourses = usePlanStore((s) => s.courses);
  const uploads = usePlanStore((s) => s.uploads);
  const courses = useMemo(() => {
    const order = new Map(uploads.map((u, i) => [u.courseId, i]));
    return [...rawCourses].sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
  }, [rawCourses, uploads]);
  const semester = useSemester();
  const uid = useId();

  const flagsById = useMemo(() => {
    const m = new Map<string, ItemFlag[]>();
    if (semester) for (const i of items) m.set(i.id, getItemFlags(i, semester));
    return m;
  }, [items, semester]);

  // Items stay in the panel after a fix (so focus isn't yanked away) until "Looks right" or a re-visit.
  const [touched, setTouched] = useState<Set<string>>(() => new Set());
  const attention = items.filter((i) => !i.reviewed && ((flagsById.get(i.id)?.length ?? 0) > 0 || touched.has(i.id)));
  const undated = items.filter((i) => !i.dueDate).length;

  if (!semester) return null;
  const update = (id: string, patch: Partial<PlanItem>) => usePlanStore.getState().updateItem(id, patch);
  const touch = (id: string) => setTouched((t) => (t.has(id) ? t : new Set(t).add(id)));

  return (
    <div>
      <StepHeader
        id="step-heading"
        title="Here's what we found. Check it before we forecast."
        description={
          <span className="tabular">
            {pluralize(items.length, "item")} from {pluralize(courses.length, "course")}. Fix anything that looks off. You can change any field.
          </span>
        }
      />

      {attention.length > 0 ? (
        <section aria-labelledby={`${uid}-attn`} className="rounded-2xl border-2 border-attention-line bg-attention-bg p-5 sm:p-6">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="size-6 text-attention-fg" aria-hidden="true" />
            <h3 id={`${uid}-attn`} className="text-xl font-semibold text-ink">
              Needs your attention <span className="font-normal text-ink-muted tabular">({attention.length})</span>
            </h3>
          </div>
          <p className="mt-1 text-ink-muted">We only flag what we couldn&rsquo;t read clearly. We never guess.</p>
          <ul className="mt-5 flex flex-col gap-3">
            {attention.map((item) => (
              <AttentionRow
                key={item.id}
                item={item}
                course={courses.find((c) => c.id === item.courseId)}
                flags={flagsById.get(item.id) ?? []}
                onChange={(patch) => {
                  touch(item.id);
                  update(item.id, patch);
                }}
                onDismiss={() => {
                  update(item.id, { reviewed: true });
                  usePlanStore.getState().announce(`Marked ${item.title} as checked.`);
                }}
              />
            ))}
          </ul>
        </section>
      ) : (
        <p className="flex items-center gap-2.5 rounded-2xl border border-line bg-clear-bg px-5 py-4 font-medium text-clear-fg">
          <CircleCheck className="size-5" aria-hidden="true" />
          Everything we flagged has been checked.
        </p>
      )}

      <div className="mt-10 flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-2xl font-semibold">All items by course</h3>
        {undated > 0 && (
          <p className="flex items-center gap-1.5 text-[15px] text-ink-muted">
            <Info className="size-4" aria-hidden="true" />
            {pluralize(undated, "item")} without a date won&rsquo;t appear in the forecast.
          </p>
        )}
      </div>
      <div className="mt-4 flex flex-col gap-4">
        {courses.map((c, i) => (
          <CourseSection key={c.id} course={c} items={items.filter((it) => it.courseId === c.id)} semester={semester} flagsById={flagsById} defaultOpen={i === 0} />
        ))}
      </div>

      <StepNav onBack={onBack}>
        <Button size="lg" onClick={onNext} disabled={items.length === 0}>
          Build my forecast
          <ArrowRight className="size-5" aria-hidden="true" />
        </Button>
      </StepNav>
    </div>
  );
}

function AttentionRow({
  item,
  course,
  flags,
  onChange,
  onDismiss,
}: {
  item: PlanItem;
  course?: Course;
  flags: ItemFlag[];
  onChange: (patch: Partial<PlanItem>) => void;
  onDismiss: () => void;
}) {
  const uid = useId();
  const needsDate = flags.some((f) => f.fix === "date");
  const needsWeight = flags.some((f) => f.fix === "weight");
  const fixed = flags.length === 0;
  return (
    <li className="rounded-xl border border-line bg-surface p-4 sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-muted">{courseLabel(course)}</p>
          <p className="text-lg font-semibold">{item.title || "Untitled item"}</p>
          {fixed ? (
            <p className="mt-1 flex items-center gap-1.5 font-medium text-clear-fg">
              <Check className="size-4" aria-hidden="true" /> Looks good now.
            </p>
          ) : (
            <ul className="mt-1 flex flex-col gap-1" id={`${uid}-why`}>
              {flags.map((f) => (
                <li key={f.code} className="text-ink">
                  {f.message}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-wrap items-end gap-3 lg:flex-nowrap">
          {needsDate && (
            <div>
              <label htmlFor={`${uid}-date`} className="mb-1 block text-[15px] font-semibold">
                Due date
              </label>
              <input
                id={`${uid}-date`}
                type="date"
                className={cn(inputClass, "w-44")}
                value={item.dueDate ?? ""}
                aria-describedby={`${uid}-why`}
                onChange={(e) => onChange({ dueDate: e.target.value || null, dateSource: e.target.value ? "user" : "tbd", dayInferred: false })}
              />
            </div>
          )}
          {needsWeight && (
            <div>
              <label htmlFor={`${uid}-w`} className="mb-1 block text-[15px] font-semibold">
                Weight %
              </label>
              <input
                id={`${uid}-w`}
                type="number"
                min={0}
                max={100}
                step="any"
                inputMode="decimal"
                className={cn(inputClass, "w-28")}
                value={item.weightPercent ?? ""}
                aria-describedby={`${uid}-why`}
                onChange={(e) => onChange({ weightPercent: parseWeight(e.target.value) })}
              />
            </div>
          )}
          <Button variant="secondary" onClick={onDismiss}>
            <Check className="size-5" aria-hidden="true" />
            Looks right
          </Button>
        </div>
      </div>
    </li>
  );
}

function parseWeight(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(100, Math.max(0, n));
}

function CourseSection({
  course,
  items,
  semester,
  flagsById,
  defaultOpen,
}: {
  course: Course;
  items: PlanItem[];
  semester: Semester;
  flagsById: Map<string, ItemFlag[]>;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const uid = useId();
  const total = Math.round(items.reduce((s, i) => s + (i.weightPercent ?? 0), 0) * 10) / 10;
  const weightNote = total < 90 || total > 110;
  const label = courseLabel(course);

  const addItem = () => {
    const id = usePlanStore.getState().addItem(course.id);
    setOpen(true);
    requestAnimationFrame(() => document.getElementById(`title-${id}`)?.focus());
  };

  return (
    <section className="card overflow-hidden" aria-labelledby={`${uid}-h`}>
      <h4 id={`${uid}-h`} className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${uid}-body`}
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-16 w-full items-center gap-4 px-5 py-4 text-left hover:bg-canvas sm:px-6"
        >
          <ChevronDown className={cn("size-5 shrink-0 text-ink-muted transition-transform", open && "rotate-180")} aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-semibold">
              {label}
              {course.code && course.title && <span className="font-normal text-ink-muted">: {course.title}</span>}
            </span>
            <span className="block text-[15px] text-ink-muted tabular">
              {pluralize(items.length, "item")} · weights total {fmtPct(total)}
            </span>
          </span>
        </button>
      </h4>
      {open && (
        <div id={`${uid}-body`} className="border-t border-line">
          {weightNote && (
            <p className="flex items-start gap-2 border-b border-line bg-busy-bg px-5 py-3 text-[15px] text-busy-fg sm:px-6">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              These add up to {fmtPct(total)}. That&rsquo;s OK, but some items may be missing.
            </p>
          )}
          <div
            aria-hidden="true"
            className="hidden grid-cols-[minmax(0,1fr)_9.5rem_10.5rem_6.5rem_6.5rem_2.75rem] gap-3 border-b border-line bg-canvas px-6 py-2.5 text-sm font-semibold text-ink-muted md:grid"
          >
            <span>Item</span>
            <span>Type</span>
            <span>Due date</span>
            <span>Weight %</span>
            <span>Heavy for me</span>
            <span />
          </div>
          <ul className="divide-y divide-line">
            {items.map((item) => (
              <ItemRow key={item.id} item={item} flags={flagsById.get(item.id) ?? []} semester={semester} courseLabelText={label} />
            ))}
          </ul>
          <div className="border-t border-line px-5 py-3 sm:px-6">
            <Button variant="ghost" onClick={addItem}>
              <Plus className="size-5" aria-hidden="true" />
              Add item to {label}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function ItemRow({ item, flags, courseLabelText }: { item: PlanItem; flags: ItemFlag[]; semester: Semester; courseLabelText: string }) {
  const id = item.id;
  const update = (patch: Partial<PlanItem>) => usePlanStore.getState().updateItem(id, patch);
  const name = item.title || "this item";
  const needsAttention = !item.reviewed && flags.length > 0;
  const notes = [...item.systemNotes, ...(item.note ? [item.note] : [])];

  const remove = () => {
    const res = usePlanStore.getState().deleteItem(id);
    if (!res) return;
    usePlanStore.getState().announce(`Deleted ${name}.`);
    toast(`Deleted “${res.item.title || "Untitled item"}”`, {
      action: { label: "Undo", onClick: () => usePlanStore.getState().restoreItem(res.item, res.index) },
      duration: 7000,
    });
  };

  const labelCls = "mb-1 block text-sm font-semibold text-ink-muted md:sr-only";
  return (
    <li className="grid grid-cols-2 gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_9.5rem_10.5rem_6.5rem_6.5rem_2.75rem] md:items-start md:px-6">
      <div className="col-span-2 md:col-span-1">
        <label htmlFor={`title-${id}`} className={labelCls}>
          Item <span className="sr-only">in {courseLabelText}</span>
        </label>
        <input
          id={`title-${id}`}
          className={cn(inputClass, "font-medium")}
          value={item.title}
          placeholder="Item name"
          maxLength={140}
          onChange={(e) => update({ title: e.target.value })}
        />
        {(needsAttention || notes.length > 0) && (
          <p className="mt-1.5 text-sm leading-snug text-ink-muted">
            {needsAttention && (
              <span className="mr-2 inline-flex items-center gap-1 font-semibold text-attention-fg">
                <AlertTriangle className="size-3.5" aria-hidden="true" />
                Needs attention
              </span>
            )}
            {notes.join(" ")}
          </p>
        )}
      </div>
      <div>
        <label htmlFor={`type-${id}`} className={labelCls}>
          Type <span className="sr-only">for {name}</span>
        </label>
        <select id={`type-${id}`} className={selectClass} value={item.type} onChange={(e) => update({ type: e.target.value as PlanItem["type"] })}>
          {ITEM_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABEL[t]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`date-${id}`} className={labelCls}>
          Due date <span className="sr-only">for {name}</span>
        </label>
        <input
          id={`date-${id}`}
          type="date"
          className={inputClass}
          value={item.dueDate ?? ""}
          onChange={(e) => update({ dueDate: e.target.value || null, dateSource: e.target.value ? "user" : "tbd", dayInferred: false })}
        />
      </div>
      <div>
        <label htmlFor={`w-${id}`} className={labelCls}>
          Weight % <span className="sr-only">for {name}</span>
        </label>
        <input
          id={`w-${id}`}
          type="number"
          min={0}
          max={100}
          step="any"
          inputMode="decimal"
          className={inputClass}
          value={item.weightPercent ?? ""}
          placeholder="—"
          onChange={(e) => update({ weightPercent: parseWeight(e.target.value) })}
        />
      </div>
      <div className="flex min-h-11 items-center gap-3 md:justify-center">
        <Checkbox id={`heavy-${id}`} checked={item.heavy} onCheckedChange={(v) => update({ heavy: v === true })} />
        <label htmlFor={`heavy-${id}`} className="text-[15px] font-medium md:sr-only">
          Heavy for me <span className="sr-only">: {name}</span>
        </label>
      </div>
      <div className="flex items-center justify-end">
        <Button variant="ghost" size="icon" onClick={remove} aria-label={`Delete ${name}`}>
          <Trash2 className="size-5" aria-hidden="true" />
        </Button>
      </div>
    </li>
  );
}
