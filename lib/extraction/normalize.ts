/**
 * Post-processing of AI output, in deterministic code (not AI):
 * stable ids, "Week N" resolution, group-weight splitting, and attention flags.
 */
import { isValidISODate, type DayOfWeek, type ISODate } from "@/lib/dates";
import type { Semester } from "@/lib/calendar/semester";
import type { SyllabusExtraction } from "@/lib/ai/schema";
import { getItemFlags, type FlagCode } from "@/lib/forecast/flags";
import { getSemesterWeeks, resolveRelativeDate } from "@/lib/forecast/weeks";
import type { Confidence, DateSource, ItemType } from "@/lib/forecast/types";

export interface NormalizedItem {
  id: string;
  title: string;
  type: ItemType;
  weightPercent: number | null;
  dueDate: ISODate | null;
  dateSource: DateSource;
  dayInferred: boolean;
  rawDateText: string;
  confidence: Confidence;
  note: string | null;
  systemNotes: string[];
  groupName: string | null;
  flags: FlagCode[];
}

export interface NormalizedCourse {
  code: string | null;
  title: string | null;
  meetingDays: DayOfWeek[] | null;
}

export interface ExtractionResult {
  course: NormalizedCourse;
  items: NormalizedItem[];
  warnings: string[];
  usage: { inputTokens: number; outputTokens: number };
  durationMs: number;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

const DAY_FULL: Record<DayOfWeek, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

export function normalizeExtraction(
  raw: SyllabusExtraction,
  semester: Semester,
  newId: () => string = () => crypto.randomUUID(),
): Pick<ExtractionResult, "course" | "items" | "warnings"> {
  const weeks = getSemesterWeeks(semester);
  const meetingDays = raw.course.meetingDays && raw.course.meetingDays.length ? raw.course.meetingDays : null;

  // Group sizes for splitting group weights.
  const groupSizes = new Map<string, number>();
  for (const it of raw.items) {
    if (it.groupWeight) {
      const key = it.groupWeight.groupName.trim().toLowerCase();
      groupSizes.set(key, (groupSizes.get(key) ?? 0) + 1);
    }
  }

  const items = raw.items.map((it): NormalizedItem => {
    const systemNotes: string[] = [];
    let weightPercent = it.weightPercent;
    let groupName: string | null = null;

    if (it.groupWeight) {
      groupName = it.groupWeight.groupName.trim();
      if (weightPercent === null) {
        const listed = groupSizes.get(groupName.toLowerCase()) ?? 1;
        const count = it.groupWeight.count ?? listed;
        if (listed === 1 && count > 1 && it.date.kind === "tbd") {
          // One row standing in for the whole undated group.
          weightPercent = round2(it.groupWeight.totalPercent);
          systemNotes.push(`Covers all ${count} ${groupName.toLowerCase()} (${it.groupWeight.totalPercent}% total).`);
        } else {
          weightPercent = round2(it.groupWeight.totalPercent / count);
          systemNotes.push(`${it.groupWeight.totalPercent}% split evenly across ${count} ${groupName.toLowerCase()}.`);
        }
      }
    }

    let dueDate: ISODate | null = null;
    let dateSource: DateSource = "tbd";
    let dayInferred = false;

    if (it.date.kind === "absolute") {
      if (it.date.isoDate && isValidISODate(it.date.isoDate)) {
        dueDate = it.date.isoDate;
        dateSource = "absolute";
      } else {
        dateSource = "unparseable";
      }
    } else if (it.date.kind === "relative") {
      const resolved = it.date.week !== null ? resolveRelativeDate(weeks, it.date.week, it.date.dayOfWeek, meetingDays) : null;
      if (resolved) {
        dueDate = resolved.date;
        dateSource = "relative";
        dayInferred = resolved.dayInferred;
        const raw = it.date.rawText.trim() || `Week ${it.date.week}${it.date.dayOfWeek ? `, ${DAY_FULL[it.date.dayOfWeek]}` : ""}`;
        systemNotes.push(`Calculated from "${raw}".`);
      } else {
        dateSource = "unparseable";
      }
    }

    const base = {
      title: it.title.trim(),
      type: it.type,
      weightPercent,
      dueDate,
      dateSource,
      dayInferred,
      rawDateText: it.date.rawText.trim(),
      confidence: it.confidence,
      note: it.note?.trim() || null,
    };
    return {
      id: newId(),
      ...base,
      systemNotes,
      groupName,
      flags: getItemFlags(base, semester).map((f) => f.code),
    };
  });

  return {
    course: {
      code: raw.course.code?.trim() || null,
      title: raw.course.title?.trim() || null,
      meetingDays,
    },
    items,
    warnings: raw.warnings,
  };
}
