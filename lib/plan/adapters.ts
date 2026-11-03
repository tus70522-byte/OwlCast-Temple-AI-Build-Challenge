import type { ExtractionResult } from "@/lib/extraction/normalize";
import type { Course, EngineItem, PlanItem } from "@/lib/forecast/types";

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

export function courseLabel(course: Pick<Course, "code" | "title" | "sourceName"> | undefined): string {
  if (!course) return "Course";
  return course.code || course.title || course.sourceName.replace(/\.[^.]+$/, "");
}

/** Turn an /api/extract result into a course + plan items (fresh ids). */
export function extractionToPlan(result: ExtractionResult, sourceName: string): { course: Course; items: PlanItem[] } {
  const course: Course = {
    id: newId(),
    code: result.course.code,
    title: result.course.title,
    meetingDays: result.course.meetingDays,
    sourceName,
  };
  const items: PlanItem[] = result.items.map((i) => ({
    id: newId(),
    courseId: course.id,
    title: i.title,
    type: i.type,
    weightPercent: i.weightPercent,
    dueDate: i.dueDate,
    dateSource: i.dateSource,
    dayInferred: i.dayInferred,
    rawDateText: i.rawDateText,
    confidence: i.confidence,
    note: i.note,
    systemNotes: i.systemNotes,
    groupName: i.groupName,
    heavy: false,
    reviewed: false,
  }));
  return { course, items };
}

export function toEngineItems(items: PlanItem[], courses: Course[]): EngineItem[] {
  const byId = new Map(courses.map((c) => [c.id, c]));
  return items.map((i) => ({
    id: i.id,
    title: i.title,
    type: i.type,
    weightPercent: i.weightPercent,
    dueDate: i.dueDate,
    heavy: i.heavy,
    courseLabel: courseLabel(byId.get(i.courseId)),
  }));
}
