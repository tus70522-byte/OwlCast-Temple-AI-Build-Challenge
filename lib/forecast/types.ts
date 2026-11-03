import type { DayOfWeek, ISODate } from "@/lib/dates";

export const ITEM_TYPES = [
  "exam",
  "quiz",
  "paper",
  "project",
  "presentation",
  "homework",
  "lab",
  "participation",
  "other",
] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export type Confidence = "high" | "medium" | "low";
/** Where an item's due date came from. */
export type DateSource = "absolute" | "relative" | "tbd" | "unparseable" | "user";

export interface Course {
  id: string;
  code: string | null;
  title: string | null;
  meetingDays: DayOfWeek[] | null;
  sourceName: string;
}

/** The minimum an item needs for the forecast engine. */
export interface EngineItem {
  id: string;
  title: string;
  type: ItemType;
  weightPercent: number | null;
  dueDate: ISODate | null;
  heavy: boolean;
  /** e.g. "STAT 1001" — used for calendar titles */
  courseLabel: string;
}

export interface PlanItem {
  id: string;
  courseId: string;
  title: string;
  type: ItemType;
  weightPercent: number | null;
  dueDate: ISODate | null;
  dateSource: DateSource;
  /** True when a relative "Week N" date had no weekday, so we picked one. */
  dayInferred: boolean;
  rawDateText: string;
  confidence: Confidence;
  note: string | null;
  /** System notes from normalization, e.g. "Calculated from 'Week 7, Friday'" */
  systemNotes: string[];
  groupName: string | null;
  heavy: boolean;
  /** Student pressed "Looks right" on the current flags. */
  reviewed: boolean;
}

export interface WorkShift {
  id: string;
  day: DayOfWeek;
  start: string; // HH:MM
  end: string; // HH:MM
  label: string;
}

export type Rating = "clear" | "busy" | "storm" | "break";

export interface SemesterWeek {
  weekNumber: number;
  start: ISODate;
  end: ISODate;
  noClassDays: { date: ISODate; label: string }[];
  isBreak: boolean;
  hasFinals: boolean;
  finalsDays: ISODate[];
  studyDays: ISODate[];
  deadlines: { date: ISODate; label: string }[];
  /** Human notes, e.g. "No classes Mon, Jan 18 · Dr. Martin Luther King, Jr. Day" */
  notes: string[];
}

export interface WeekForecast {
  week: SemesterWeek;
  items: EngineItem[];
  load: number;
  majorCount: number;
  rating: Rating;
  hasFinals: boolean;
}

export interface Recommendation {
  itemId: string;
  startDate: ISODate | "now";
  reason: string;
  dueWeek: number;
}
