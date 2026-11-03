import { formatShort } from "@/lib/dates";
import { findNoClassDay, type Semester } from "@/lib/calendar/semester";
import { DEFAULT_WEIGHTS } from "./config";
import type { PlanItem } from "./types";

export type FlagCode =
  | "tbd"
  | "unparseable"
  | "missing-weight"
  | "low-confidence"
  | "calculated"
  | "no-class-day"
  | "outside-semester";

export interface ItemFlag {
  code: FlagCode;
  message: string;
  /** Which inline fix to offer. */
  fix: "date" | "weight" | "none";
}

type FlagInput = Pick<
  PlanItem,
  "title" | "type" | "weightPercent" | "dueDate" | "dateSource" | "dayInferred" | "rawDateText" | "confidence" | "note"
>;

/**
 * Deterministic "needs your attention" checks. Used both by normalization (server)
 * and by the confirm step (client) so edits re-check instantly.
 */
export function getItemFlags(item: FlagInput, semester: Semester): ItemFlag[] {
  const flags: ItemFlag[] = [];
  const raw = item.rawDateText?.trim();

  if (!item.dueDate) {
    if (item.dateSource === "unparseable") {
      flags.push({ code: "unparseable", fix: "date", message: `We couldn't read the date${raw ? ` "${raw}"` : ""}. Add it if you know it.` });
    } else if (item.type !== "participation") {
      flags.push({ code: "tbd", fix: "date", message: `Date is ${raw ? `"${raw}"` : "TBD"}. Add it when you know it. Until then it stays out of the forecast.` });
    }
  } else {
    const noClass = findNoClassDay(semester, item.dueDate);
    if (item.dueDate < semester.classesBegin || item.dueDate > semester.semesterEnd) {
      flags.push({ code: "outside-semester", fix: "date", message: `${formatShort(item.dueDate)} is outside ${semester.label}. Please check the date.` });
    } else if (noClass) {
      flags.push({
        code: "no-class-day",
        fix: "date",
        message:
          item.dateSource === "relative"
            ? `Calculated date falls on ${noClass.label}. Please check.`
            : `Due ${formatShort(item.dueDate)}, which is ${noClass.label} (no classes). Please check.`,
      });
    } else if (item.dateSource === "relative" && item.dayInferred) {
      flags.push({
        code: "calculated",
        fix: "date",
        message: `Calculated from "${raw || "Week N"}". We picked ${formatShort(item.dueDate)}. Please check.`,
      });
    }
  }

  if (item.weightPercent === null && item.type !== "participation") {
    flags.push({
      code: "missing-weight",
      fix: "weight",
      message: `No grade weight found. We'll estimate ${DEFAULT_WEIGHTS[item.type]}% for a ${item.type} until you add one.`,
    });
  }

  if (item.confidence === "low" && !flags.some((f) => f.code === "tbd" || f.code === "unparseable")) {
    flags.push({ code: "low-confidence", fix: "none", message: item.note ? `Not sure: ${item.note}` : "The AI wasn't confident about this item." });
  }
  return flags;
}
