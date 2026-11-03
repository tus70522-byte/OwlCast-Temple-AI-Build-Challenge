import { z } from "zod";
import { ITEM_TYPES } from "@/lib/forecast/types";

const Day = z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);

/** Mirrors the `record_syllabus_items` tool input schema exactly. */
export const SyllabusExtractionSchema = z.object({
  course: z.object({
    code: z.string().nullable(),
    title: z.string().nullable(),
    meetingDays: z.array(Day).nullable(),
  }),
  items: z.array(
    z.object({
      title: z.string().min(1),
      type: z.enum(ITEM_TYPES),
      weightPercent: z.number().min(0).max(100).nullable(),
      groupWeight: z
        .object({
          groupName: z.string(),
          totalPercent: z.number().min(0).max(100),
          count: z.number().int().positive().nullable(),
        })
        .nullable(),
      date: z.object({
        kind: z.enum(["absolute", "relative", "tbd"]),
        isoDate: z.string().nullable(),
        week: z.number().int().nullable(),
        dayOfWeek: Day.nullable(),
        rawText: z.string(),
      }),
      confidence: z.enum(["high", "medium", "low"]),
      note: z.string().nullable(),
    }),
  ),
  warnings: z.array(z.string()),
});

export type SyllabusExtraction = z.infer<typeof SyllabusExtractionSchema>;

/** API inputs */
export const SemesterInputSchema = z.object({
  semesterId: z.string().min(1).max(40),
  semesterStart: z.string().max(10).optional().nullable(),
  semesterEnd: z.string().max(10).optional().nullable(),
});

export const PasteInputSchema = SemesterInputSchema.extend({
  text: z.string().trim().min(1, "Paste some syllabus text first.").max(100_000, "That text is over 100,000 characters. Paste just the grading and schedule sections."),
  courseName: z.string().trim().max(120).optional().nullable(),
});
