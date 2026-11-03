import { createEvents, type EventAttributes } from "ics";
import { addDays, toIcsDateArray, todayISO, type ISODate } from "@/lib/dates";
import type { Semester } from "@/lib/calendar/semester";
import type { EngineItem, Recommendation } from "./types";

function allDay(title: string, start: ISODate, endInclusive: ISODate, uid: string, description?: string): EventAttributes {
  return {
    uid: `${uid}@owlcast`,
    title,
    start: toIcsDateArray(start),
    end: toIcsDateArray(addDays(endInclusive, 1)),
    description,
    transp: "TRANSPARENT",
    productId: "OwlCast",
  } as EventAttributes;
}

function formatWeight(w: number | null): string {
  if (w === null) return "";
  return ` (${Number.isInteger(w) ? w : w.toFixed(1)}%)`;
}

export function itemEventTitle(item: EngineItem): string {
  return `${item.courseLabel}: ${item.title}${formatWeight(item.weightPercent)}`;
}

/**
 * Build an .ics calendar. Titles: "MIS 2502: Midterm Exam (25%)",
 * "Start: MIS 2502 Group Project", "Temple: Spring Break".
 */
export function buildIcs(
  items: EngineItem[],
  recommendations: Recommendation[],
  semester: Semester,
  includeTemple: boolean,
  today: ISODate = todayISO(),
): string {
  const events: EventAttributes[] = [];
  const byId = new Map(items.map((i) => [i.id, i]));

  for (const item of items) {
    if (!item.dueDate) continue;
    events.push(allDay(itemEventTitle(item), item.dueDate, item.dueDate, `due-${item.id}`, "Due date from your syllabus. Always check Canvas for changes."));
  }
  for (const rec of recommendations) {
    const item = byId.get(rec.itemId);
    if (!item) continue;
    const date = rec.startDate === "now" ? today : rec.startDate;
    events.push(allDay(`Start: ${item.courseLabel} ${item.title}`, date, date, `start-${item.id}`, rec.reason));
  }
  if (includeTemple) {
    semester.noClassDays.forEach((r, i) => events.push(allDay(`Temple: ${r.label}`, r.start, r.end, `noclass-${semester.id}-${i}`)));
    semester.finals.forEach((r, i) => events.push(allDay(`Temple: ${r.label}`, r.start, r.end, `finals-${semester.id}-${i}`)));
    semester.deadlines.forEach((d, i) => events.push(allDay(`Temple: ${d.label}`, d.date, d.date, `deadline-${semester.id}-${i}`)));
  }

  const { error, value } = createEvents(events, { productId: "OwlCast", calName: `OwlCast · ${semester.label}` });
  if (error || !value) throw new Error("Could not build the calendar file.");
  return value;
}
