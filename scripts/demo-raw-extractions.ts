/**
 * Hand-written `record_syllabus_items` tool outputs for the 4 sample syllabi, transcribed
 * item by item from the files in public/sample-syllabi/. Used by `npm run record:fixtures`
 * when no ANTHROPIC_API_KEY is available, so the saved demo fixtures still go through the
 * exact same normalization code as live extractions.
 */
import type { SyllabusExtraction } from "@/lib/ai/schema";

type RawItem = SyllabusExtraction["items"][number];

const abs = (iso: string, rawText: string): RawItem["date"] => ({ kind: "absolute", isoDate: iso, week: null, dayOfWeek: null, rawText });
const tbd = (rawText: string): RawItem["date"] => ({ kind: "tbd", isoDate: null, week: null, dayOfWeek: null, rawText });
const rel = (week: number, day: RawItem["date"]["dayOfWeek"], rawText: string): RawItem["date"] => ({
  kind: "relative",
  isoDate: null,
  week,
  dayOfWeek: day,
  rawText,
});
const item = (p: Partial<RawItem> & Pick<RawItem, "title" | "type" | "date">): RawItem => ({
  weightPercent: null,
  groupWeight: null,
  confidence: "high",
  note: null,
  ...p,
});

const problemSet = (n: number, iso: string, raw: string) =>
  item({
    title: `Problem Set ${n}`,
    type: "homework",
    groupWeight: { groupName: "Problem sets", totalPercent: 20, count: 8 },
    date: abs(iso, raw),
  });

export const DEMO_RAW: Record<string, SyllabusExtraction> = {
  "intro-statistics": {
    course: { code: "STAT 1001", title: "Introduction to Statistics", meetingDays: ["Tue", "Thu"] },
    items: [
      problemSet(1, "2027-01-28", "Thu, Jan 28"),
      problemSet(2, "2027-02-04", "Thu, Feb 4"),
      problemSet(3, "2027-02-11", "Thu, Feb 11"),
      problemSet(4, "2027-02-18", "Thu, Feb 18"),
      item({ title: "Midterm Exam", type: "exam", weightPercent: 25, date: abs("2027-02-25", "Thu, Feb 25") }),
      problemSet(5, "2027-03-11", "Thu, Mar 11"),
      problemSet(6, "2027-03-18", "Thu, Mar 18"),
      problemSet(7, "2027-03-25", "Thu, Mar 25"),
      problemSet(8, "2027-04-08", "Thu, Apr 8"),
      item({
        title: "Final Exam",
        type: "exam",
        weightPercent: 35,
        date: tbd("TBA (per the university final exam schedule)"),
        confidence: "medium",
        note: "Held during finals week; the exact date isn't in the syllabus yet.",
      }),
      item({ title: "Participation and in-class activities", type: "participation", weightPercent: 20, date: tbd("") }),
    ],
    warnings: [],
  },

  "information-systems": {
    course: { code: "MIS 1050", title: "Information Systems Foundations", meetingDays: ["Mon", "Wed"] },
    items: [
      ...(
        [
          [1, 2],
          [2, 3],
          [3, 5],
          [4, 6],
          [5, 9],
          [6, 10],
          [7, 11],
          [8, 13],
          [9, 14],
          [10, 15],
        ] as const
      ).map(([n, wk]) =>
        item({
          title: `Homework ${n}`,
          type: "homework",
          groupWeight: { groupName: "Homework", totalPercent: 20, count: 10 },
          date: rel(wk, "Fri", `Week ${wk}, Friday`),
        }),
      ),
      item({
        title: "Group Project Proposal",
        type: "project",
        weightPercent: 10,
        date: rel(4, null, "Week 4"),
        confidence: "medium",
        note: "The schedule gives the week but not the day.",
      }),
      item({ title: "Group Project Milestone", type: "project", weightPercent: 20, date: rel(7, "Fri", "Week 7, Friday") }),
      item({
        title: "Final Project Presentation and Report",
        type: "presentation",
        weightPercent: 35,
        date: tbd("Week 16, during our scheduled final exam slot (TBA)"),
        confidence: "medium",
        note: "Scheduled during finals week; the exact date isn't set.",
      }),
      item({ title: "Participation", type: "participation", weightPercent: 15, date: tbd("") }),
    ],
    warnings: [],
  },

  "business-writing": {
    course: { code: "BCOM 2100", title: "Business Writing", meetingDays: ["Mon", "Wed"] },
    items: [
      item({ title: "Professional Email Exercise", type: "other", weightPercent: 5, date: abs("2027-01-13", "Wednesday, January 13") }),
      item({ title: "Persuasive Memo", type: "paper", weightPercent: 5, date: abs("2027-02-01", "Monday, February 1") }),
      item({ title: "Annotated Bibliography", type: "paper", weightPercent: 5, date: abs("2027-02-03", "Wednesday, February 3") }),
      item({ title: "Research Paper", type: "paper", weightPercent: 20, date: abs("2027-02-22", "Monday, February 22, 2027") }),
      item({
        title: "Final Portfolio",
        type: "project",
        weightPercent: 35,
        date: tbd("TBD"),
        confidence: "low",
        note: "Due date is TBD and will be announced in class.",
      }),
      item({ title: "Workshop participation", type: "participation", weightPercent: 30, date: tbd("") }),
    ],
    warnings: [],
  },

  "risk-management": {
    course: { code: "RISK 2150", title: "Principles of Risk Management", meetingDays: ["Mon", "Wed"] },
    items: [
      ...(
        [
          [1, "2027-01-20", "Wed, Jan 20, 2027"],
          [2, "2027-02-17", "Wed, Feb 17, 2027"],
          [3, "2027-03-10", "Wed, Mar 10, 2027"],
          [4, "2027-03-24", "Wed, Mar 24, 2027"],
          [5, "2027-04-14", "Wed, Apr 14, 2027"],
        ] as const
      ).map(([n, iso, raw]) =>
        item({ title: `Case Brief ${n}`, type: "paper", weightPercent: 5, groupWeight: { groupName: "Case briefs", totalPercent: 25, count: 5 }, date: abs(iso, raw) }),
      ),
      ...(
        [
          [1, "2027-01-25", "Mon, Jan 25, 2027"],
          [2, "2027-02-08", "Mon, Feb 8, 2027"],
          [3, "2027-03-15", "Mon, Mar 15, 2027"],
          [4, "2027-04-05", "Mon, Apr 5, 2027"],
          [5, "2027-04-19", "Mon, Apr 19, 2027"],
        ] as const
      ).map(([n, iso, raw]) =>
        item({ title: `Quiz ${n}`, type: "quiz", weightPercent: 3, groupWeight: { groupName: "Quizzes", totalPercent: 15, count: 5 }, date: abs(iso, raw) }),
      ),
      item({ title: "Exam 1", type: "exam", weightPercent: 20, date: abs("2027-02-24", "Wed, Feb 24, 2027") }),
      item({ title: "Exam 2", type: "exam", weightPercent: 20, date: abs("2027-03-31", "Wed, Mar 31, 2027") }),
      item({ title: "Final reflection", type: "paper", weightPercent: 5, date: abs("2027-04-26", "Mon, Apr 26, 2027") }),
      item({ title: "Participation", type: "participation", weightPercent: 15, date: tbd("") }),
    ],
    warnings: ["The syllabus contains a line addressed to AI tools. It was ignored."],
  },

  generic: {
    course: { code: null, title: "Your course", meetingDays: null },
    items: [
      item({ title: "Midterm Exam", type: "exam", weightPercent: 25, date: rel(6, "Wed", "Week 6, Wednesday") }),
      item({ title: "Term Paper", type: "paper", weightPercent: 20, date: rel(11, "Fri", "Week 11, Friday") }),
      item({ title: "Final Exam", type: "exam", weightPercent: 30, date: tbd("Finals week (TBA)") }),
      item({ title: "Homework", type: "homework", groupWeight: { groupName: "Homework", totalPercent: 25, count: null }, date: tbd("Weekly"), note: "Weekly homework without individual dates." }),
    ],
    warnings: ["Mock mode: this is a sample result, not a reading of your file."],
  },
};
