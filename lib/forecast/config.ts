import type { ItemType } from "./types";

/** Default grade weight (%) used when a syllabus gives none. */
export const DEFAULT_WEIGHTS: Record<ItemType, number> = {
  exam: 20,
  project: 15,
  paper: 15,
  presentation: 10,
  quiz: 3,
  lab: 3,
  homework: 2,
  participation: 0,
  other: 5,
};

/** Days of preparation recommended before the due date. */
export const PREP_DAYS: Record<ItemType, number> = {
  exam: 7,
  project: 14,
  paper: 10,
  presentation: 7,
  quiz: 2,
  lab: 3,
  homework: 2,
  participation: 0,
  other: 3,
};

/** Items at or above this weight get start-date recommendations. */
export const MAJOR_ITEM_MIN_WEIGHT = 10;
export const HEAVY_MULTIPLIER = 1.5;
/** Week load >= 10 → Busy */
export const BUSY_THRESHOLD = 10;
/** Week load >= 25 → Storm */
export const STORM_THRESHOLD = 25;
/** OR >= 3 major items due that week → Storm */
export const STORM_MAJOR_COUNT = 3;
export const LONG_SHIFT_HOURS = 6;
/** How far back we'll move a start date to dodge a long work day. */
export const SHIFT_MAX_MOVE_DAYS = 3;
