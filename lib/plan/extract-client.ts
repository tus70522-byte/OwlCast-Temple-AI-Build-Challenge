"use client";

import type { Semester } from "@/lib/calendar/semester";
import type { ExtractionResult } from "@/lib/extraction/normalize";

export const MAX_FILES = 8;
export const MAX_FILE_BYTES = 4 * 1024 * 1024;
export const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt"];
export const DEMO_TIMEOUT_MS = 25_000;
const REQUEST_TIMEOUT_MS = 65_000;

export class ClientExtractionError extends Error {
  constructor(
    message: string,
    public retryable: boolean,
  ) {
    super(message);
  }
}

/** Client-side pre-check so obviously wrong files fail instantly. */
export function precheckFile(file: File): string | null {
  const lower = file.name.toLowerCase();
  if (!ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
    return "OwlCast reads PDF, Word (.docx), and plain text (.txt) files.";
  }
  if (file.size === 0) return "This file is empty.";
  if (file.size > MAX_FILE_BYTES) return "This file is over 4 MB. Try a smaller file or paste the text instead.";
  return null;
}

function semesterFields(semester: Semester) {
  return {
    semesterId: semester.isTemple ? semester.id : "custom",
    semesterStart: semester.classesBegin,
    semesterEnd: semester.semesterEnd,
  };
}

async function send(body: BodyInit, headers: HeadersInit | undefined, timeoutMs: number): Promise<ExtractionResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch("/api/extract", { method: "POST", body, headers, signal: controller.signal });
  } catch {
    throw new ClientExtractionError(
      controller.signal.aborted ? "Reading took too long. Try again." : "We couldn't reach OwlCast. Check your connection and try again.",
      true,
    );
  } finally {
    clearTimeout(timer);
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON */
  }
  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Something went wrong while reading this syllabus. Try again.";
    throw new ClientExtractionError(message, res.status >= 429 || res.status === 0);
  }
  return data as ExtractionResult;
}

export function extractFile(file: File, semester: Semester, timeoutMs = REQUEST_TIMEOUT_MS) {
  const form = new FormData();
  form.set("file", file);
  for (const [k, v] of Object.entries(semesterFields(semester))) form.set(k, v);
  return send(form, undefined, timeoutMs);
}

export function extractText(text: string, courseName: string, semester: Semester) {
  return send(JSON.stringify({ text, courseName: courseName || null, ...semesterFields(semester) }), { "content-type": "application/json" }, REQUEST_TIMEOUT_MS);
}

/** Run async tasks with a concurrency cap. */
export async function runWithConcurrency<T>(tasks: (() => Promise<T>)[], limit = 4): Promise<void> {
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) {
      const i = next++;
      await tasks[i]().catch(() => undefined);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
}
