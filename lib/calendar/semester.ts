import { isValidISODate, type ISODate } from "@/lib/dates";
import { TEMPLE_SEMESTERS, type TempleSemesterId } from "./temple-calendar";

export interface DateRange {
  start: ISODate;
  end: ISODate;
  label: string;
}

export interface Semester {
  id: string;
  label: string;
  classesBegin: ISODate;
  classesEnd: ISODate;
  semesterEnd: ISODate;
  noClassDays: DateRange[];
  studyDays: ISODate[];
  finals: DateRange[];
  deadlines: { date: ISODate; label: string }[];
  isTemple: boolean;
}

export function isTempleSemesterId(id: string): id is TempleSemesterId {
  return Object.prototype.hasOwnProperty.call(TEMPLE_SEMESTERS, id);
}

export function getTempleSemester(id: TempleSemesterId): Semester {
  const s = TEMPLE_SEMESTERS[id];
  return {
    id,
    label: s.label,
    classesBegin: s.classesBegin,
    classesEnd: s.classesEnd,
    semesterEnd: s.semesterEnd,
    noClassDays: s.noClassDays.map((r) => ({ ...r })),
    studyDays: [...s.studyDays],
    finals: s.finals.map((r) => ({ ...r })),
    deadlines: s.deadlines.map((d) => ({ ...d })),
    isTemple: true,
  };
}

export function getCustomSemester(start: ISODate, end: ISODate): Semester {
  return {
    id: "custom",
    label: "Custom semester",
    classesBegin: start,
    classesEnd: end,
    semesterEnd: end,
    noClassDays: [],
    studyDays: [],
    finals: [],
    deadlines: [],
    isTemple: false,
  };
}

/** Resolve a semester from an id plus optional custom dates. Returns null if invalid. */
export function resolveSemester(id: string, start?: string | null, end?: string | null): Semester | null {
  if (isTempleSemesterId(id)) return getTempleSemester(id);
  if (id === "custom" && isValidISODate(start) && isValidISODate(end) && end > start) {
    return getCustomSemester(start, end);
  }
  return null;
}

export function findNoClassDay(semester: Semester, iso: ISODate): DateRange | undefined {
  return semester.noClassDays.find((r) => iso >= r.start && iso <= r.end);
}

export function isFinalsDay(semester: Semester, iso: ISODate): boolean {
  return semester.finals.some((r) => iso >= r.start && iso <= r.end);
}

export function isStudyDay(semester: Semester, iso: ISODate): boolean {
  return semester.studyDays.includes(iso);
}
