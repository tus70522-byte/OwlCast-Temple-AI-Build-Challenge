import { NextResponse, type NextRequest } from "next/server";
import { extractWithClaude, ExtractionError, type SyllabusSource } from "@/lib/ai/extract";
import { PasteInputSchema, SemesterInputSchema } from "@/lib/ai/schema";
import { resolveSemester } from "@/lib/calendar/semester";
import { fixtureForName, GENERIC_FIXTURE } from "@/lib/extraction/fixtures";
import { normalizeExtraction, type ExtractionResult } from "@/lib/extraction/normalize";
import { FileRejected, fileToSource, MAX_FILE_BYTES } from "@/lib/extraction/read-file";
import { checkRateLimit } from "@/lib/rate-limit";

// Runs on the Node.js runtime (the default). Next 16 with Cache Components rejects an explicit
// `export const runtime`, so it is intentionally omitted.
export const maxDuration = 60;

function fail(error: string, status: number, headers?: HeadersInit) {
  return NextResponse.json({ error }, { status, headers });
}

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

/** Fresh ids so the same fixture can be loaded more than once. */
function withFreshIds(result: ExtractionResult): ExtractionResult {
  return { ...result, items: result.items.map((i) => ({ ...i, id: crypto.randomUUID() })) };
}

export async function POST(req: NextRequest) {
  const started = Date.now();
  const limit = checkRateLimit(clientIp(req));
  if (!limit.ok) {
    return fail("You've read a lot of syllabi in a short time. Wait a few minutes and try again.", 429, {
      "Retry-After": String(limit.retryAfterSec),
    });
  }

  const contentType = req.headers.get("content-type") ?? "";
  let source: SyllabusSource | null = null;
  let sourceName = "pasted-text";
  let courseName: string | null = null;
  let semesterInput: { semesterId: string; semesterStart?: string | null; semesterEnd?: string | null };

  try {
    if (contentType.includes("multipart/form-data")) {
      const declared = Number(req.headers.get("content-length") ?? 0);
      if (declared > MAX_FILE_BYTES + 64 * 1024) return fail("This file is over 4 MB. Try a smaller file or paste the text instead.", 413);
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return fail("Choose a syllabus file to upload.", 400);
      const parsed = SemesterInputSchema.safeParse({
        semesterId: form.get("semesterId"),
        semesterStart: form.get("semesterStart"),
        semesterEnd: form.get("semesterEnd"),
      });
      if (!parsed.success) return fail("Pick a semester before uploading.", 400);
      semesterInput = parsed.data;
      sourceName = file.name;
      if (file.size > MAX_FILE_BYTES) return fail("This file is over 4 MB. Try a smaller file or paste the text instead.", 400);
      const bytes = new Uint8Array(await file.arrayBuffer());
      source = await fileToSource(file.name, bytes);
    } else if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => null);
      const parsed = PasteInputSchema.safeParse(body);
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Paste some syllabus text first.", 400);
      semesterInput = parsed.data;
      courseName = parsed.data.courseName ?? null;
      source = { kind: "text", text: parsed.data.text };
    } else {
      return fail("Send a syllabus file or pasted text.", 415);
    }
  } catch (err) {
    if (err instanceof FileRejected) return fail(err.message, 400);
    return fail("We couldn't read that upload. Try again.", 400);
  }

  const semester = resolveSemester(semesterInput.semesterId, semesterInput.semesterStart, semesterInput.semesterEnd);
  if (!semester) return fail("Those semester dates don't look right. Go back to Setup and check them.", 400);

  // Mock mode: return the matching saved fixture after a realistic delay. Used by all tests.
  if (process.env.OWLCAST_MOCK_AI === "1") {
    await new Promise((r) => setTimeout(r, Number(process.env.OWLCAST_MOCK_DELAY_MS ?? 1500)));
    const fixture = source.kind === "text" && sourceName === "pasted-text" ? GENERIC_FIXTURE : fixtureForName(sourceName);
    const result = withFreshIds(fixture);
    console.log(`[extract] mock items=${result.items.length} durationMs=${Date.now() - started}`);
    return NextResponse.json({ ...result, durationMs: Date.now() - started });
  }

  try {
    const { data, usage } = await extractWithClaude(source, semester, courseName);
    const normalized = normalizeExtraction(data, semester);
    const result: ExtractionResult = { ...normalized, usage, durationMs: Date.now() - started };
    // One line per request. Never log syllabus content.
    console.log(
      `[extract] items=${result.items.length} inputTokens=${usage.inputTokens} outputTokens=${usage.outputTokens} durationMs=${result.durationMs}`,
    );
    return NextResponse.json(result);
  } catch (err) {
    const status = err instanceof ExtractionError ? err.status : 502;
    const message = err instanceof ExtractionError ? err.message : "Something went wrong while reading this syllabus. Try again.";
    console.log(`[extract] failed status=${status} durationMs=${Date.now() - started}`);
    return fail(message, status);
  }
}
