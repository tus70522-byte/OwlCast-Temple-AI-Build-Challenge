"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { resolveSemester, type Semester } from "@/lib/calendar/semester";
import type { ExtractionResult } from "@/lib/extraction/normalize";
import type { Course, PlanItem, WorkShift } from "@/lib/forecast/types";
import { extractionToPlan, newId } from "./adapters";

export type Step = 1 | 2 | 3 | 4;
export type SemesterChoice = "spring-2027" | "fall-2026" | "custom";
export type UploadStatus = "waiting" | "reading" | "done" | "error";

export interface Upload {
  id: string;
  name: string;
  size: number;
  kind: "file" | "paste" | "demo";
  status: UploadStatus;
  itemCount?: number;
  error?: string;
  /** Result came from the saved demo fixture, not a live read. */
  savedResult?: boolean;
  /** The failure can be retried (e.g. network/timeout, not a bad file type). */
  retryable?: boolean;
  courseId?: string;
}

export interface PlanState {
  step: Step;
  /** Furthest step the student has reached (controls the step indicator). */
  furthest: Step;
  semesterChoice: SemesterChoice;
  customStart: string;
  customEnd: string;
  shifts: WorkShift[];
  uploads: Upload[];
  courses: Course[];
  items: PlanItem[];
  includeTemple: boolean;
  announcement: string;

  setStep: (step: Step) => void;
  setSemesterChoice: (c: SemesterChoice) => void;
  setCustomDates: (start: string, end: string) => void;
  addShift: () => void;
  updateShift: (id: string, patch: Partial<WorkShift>) => void;
  removeShift: (id: string) => void;
  addUpload: (u: Omit<Upload, "id"> & { id?: string }) => string;
  updateUpload: (id: string, patch: Partial<Upload>) => void;
  removeUpload: (id: string) => void;
  applyExtraction: (uploadId: string, result: ExtractionResult, sourceName: string, savedResult: boolean) => void;
  updateItem: (id: string, patch: Partial<PlanItem>) => void;
  addItem: (courseId: string) => string;
  deleteItem: (id: string) => { item: PlanItem; index: number } | null;
  restoreItem: (item: PlanItem, index: number) => void;
  setIncludeTemple: (v: boolean) => void;
  announce: (msg: string) => void;
  reset: () => void;
}

const initial = {
  step: 1 as Step,
  furthest: 1 as Step,
  semesterChoice: "spring-2027" as SemesterChoice,
  customStart: "",
  customEnd: "",
  shifts: [] as WorkShift[],
  uploads: [] as Upload[],
  courses: [] as Course[],
  items: [] as PlanItem[],
  includeTemple: true,
  announcement: "",
};

/** localStorage that never throws (private mode, blocked storage, quota). */
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      /* storage unavailable: app keeps working in memory */
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      ...initial,
      setStep: (step) => set((s) => ({ step, furthest: (Math.max(s.furthest, step) as Step) })),
      setSemesterChoice: (semesterChoice) => set({ semesterChoice }),
      setCustomDates: (customStart, customEnd) => set({ customStart, customEnd }),
      addShift: () =>
        set((s) => ({ shifts: [...s.shifts, { id: newId(), day: "Mon", start: "09:00", end: "17:00", label: "" }] })),
      updateShift: (id, patch) => set((s) => ({ shifts: s.shifts.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeShift: (id) => set((s) => ({ shifts: s.shifts.filter((x) => x.id !== id) })),
      addUpload: (u) => {
        const id = u.id ?? newId();
        set((s) => ({ uploads: [...s.uploads, { ...u, id }] }));
        return id;
      },
      updateUpload: (id, patch) => set((s) => ({ uploads: s.uploads.map((u) => (u.id === id ? { ...u, ...patch } : u)) })),
      removeUpload: (id) =>
        set((s) => {
          const upload = s.uploads.find((u) => u.id === id);
          const courseId = upload?.courseId;
          return {
            uploads: s.uploads.filter((u) => u.id !== id),
            courses: courseId ? s.courses.filter((c) => c.id !== courseId) : s.courses,
            items: courseId ? s.items.filter((i) => i.courseId !== courseId) : s.items,
          };
        }),
      applyExtraction: (uploadId, result, sourceName, savedResult) => {
        const { course, items } = extractionToPlan(result, sourceName);
        set((s) => {
          const prev = s.uploads.find((u) => u.id === uploadId)?.courseId;
          return {
            courses: [...s.courses.filter((c) => c.id !== prev), course],
            items: [...s.items.filter((i) => i.courseId !== prev), ...items],
            uploads: s.uploads.map((u) =>
              u.id === uploadId
                ? { ...u, status: "done", itemCount: items.length, courseId: course.id, savedResult, error: undefined }
                : u,
            ),
          };
        });
      },
      updateItem: (id, patch) => set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),
      addItem: (courseId) => {
        const id = newId();
        const item: PlanItem = {
          id,
          courseId,
          title: "",
          type: "homework",
          weightPercent: null,
          dueDate: null,
          dateSource: "user",
          dayInferred: false,
          rawDateText: "",
          confidence: "high",
          note: null,
          systemNotes: ["Added by you."],
          groupName: null,
          heavy: false,
          reviewed: true,
        };
        set((s) => ({ items: [...s.items, item] }));
        return id;
      },
      deleteItem: (id) => {
        const items = get().items;
        const index = items.findIndex((i) => i.id === id);
        if (index < 0) return null;
        const item = items[index];
        set({ items: items.filter((i) => i.id !== id) });
        return { item, index };
      },
      restoreItem: (item, index) =>
        set((s) => {
          const next = [...s.items];
          next.splice(Math.min(index, next.length), 0, item);
          return { items: next };
        }),
      setIncludeTemple: (includeTemple) => set({ includeTemple }),
      announce: (announcement) => set({ announcement }),
      reset: () => set({ ...initial }),
    }),
    {
      name: "owlcast-plan-v1",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
      partialize: (s) => ({
        step: s.step,
        furthest: s.furthest,
        semesterChoice: s.semesterChoice,
        customStart: s.customStart,
        customEnd: s.customEnd,
        shifts: s.shifts,
        uploads: s.uploads,
        courses: s.courses,
        items: s.items,
        includeTemple: s.includeTemple,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PlanState>;
        // Reads that were in flight when the page was refreshed can't resume.
        const uploads = (p.uploads ?? []).map((u) =>
          u.status === "reading" || u.status === "waiting"
            ? { ...u, status: "error" as const, error: "The page was refreshed while reading. Add this file again.", retryable: u.kind === "demo" }
            : u,
        );
        return { ...current, ...p, uploads };
      },
    },
  ),
);

export function getSemesterFromState(s: Pick<PlanState, "semesterChoice" | "customStart" | "customEnd">): Semester | null {
  return resolveSemester(s.semesterChoice, s.customStart, s.customEnd);
}

/** Stable semester object for components (selecting primitives avoids re-render loops). */
export function useSemester(): Semester | null {
  const choice = usePlanStore((s) => s.semesterChoice);
  const start = usePlanStore((s) => s.customStart);
  const end = usePlanStore((s) => s.customEnd);
  return useMemo(() => resolveSemester(choice, start, end), [choice, start, end]);
}
