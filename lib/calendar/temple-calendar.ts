/**
 * Temple University academic calendar (Full Term, 16-week course dates only).
 * Transcribed from the Office of the University Registrar's public academic calendar.
 * Do not scrape at runtime.
 */
export const TEMPLE_CALENDAR_SOURCE = {
  url: "https://registrar.temple.edu/academic-calendar/2026-2027-academic-calendar",
  lastUpdated: "2026-10-30",
  note: "Dates may be subject to change. Always confirm with the Temple registrar.",
};

export const TEMPLE_ATTRIBUTION =
  "Temple dates from the Office of the University Registrar's public academic calendar (updated Oct 30, 2026). Dates may be subject to change.";

export const TEMPLE_SEMESTERS = {
  "fall-2026": {
    label: "Fall 2026",
    classesBegin: "2026-08-24", // Monday
    classesEnd: "2026-12-07", // Monday — last day of classes
    semesterEnd: "2026-12-15", // last day of final exams
    noClassDays: [
      { start: "2026-09-07", end: "2026-09-07", label: "Labor Day" },
      { start: "2026-10-02", end: "2026-10-02", label: "Fall Wellness Day" },
      { start: "2026-11-23", end: "2026-11-25", label: "Fall Break" },
      { start: "2026-11-26", end: "2026-11-29", label: "Thanksgiving holiday" },
    ],
    studyDays: ["2026-12-08", "2026-12-12", "2026-12-13"],
    finals: [
      { start: "2026-12-09", end: "2026-12-11", label: "Final exams (days 1–3)" },
      { start: "2026-12-14", end: "2026-12-15", label: "Final exams (days 4–5)" },
    ],
    deadlines: [
      { date: "2026-08-31", label: "Last day to self-add a full-term course" },
      { date: "2026-09-08", label: "Last day to drop a full-term course" },
      { date: "2026-12-07", label: "Last day of classes · Last day to withdraw from a full-term course" },
    ],
  },
  "spring-2027": {
    label: "Spring 2027",
    classesBegin: "2027-01-11", // Monday
    classesEnd: "2027-04-26", // Monday — last day of classes
    semesterEnd: "2027-05-04", // last day of final exams
    noClassDays: [
      { start: "2027-01-18", end: "2027-01-18", label: "Dr. Martin Luther King, Jr. Day" },
      { start: "2027-03-01", end: "2027-03-07", label: "Spring Break" },
    ],
    studyDays: ["2027-04-27", "2027-05-01", "2027-05-02"],
    finals: [
      { start: "2027-04-28", end: "2027-04-30", label: "Final exams (days 1–3)" },
      { start: "2027-05-03", end: "2027-05-04", label: "Final exams (days 4–5)" },
    ],
    deadlines: [
      { date: "2027-01-19", label: "Last day to self-add a full-term course" },
      { date: "2027-01-25", label: "Last day to drop a full-term course" },
      { date: "2027-04-26", label: "Last day of classes · Last day to withdraw from a full-term course" },
    ],
  },
} as const;

export type TempleSemesterId = keyof typeof TEMPLE_SEMESTERS;
