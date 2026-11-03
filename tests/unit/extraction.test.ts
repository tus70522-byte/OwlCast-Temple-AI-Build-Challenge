import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { SyllabusExtractionSchema } from "@/lib/ai/schema";
import { SYSTEM_PROMPT, RECORD_TOOL } from "@/lib/ai/extraction-prompt";
import { getTempleSemester } from "@/lib/calendar/semester";
import { detectKind, FileRejected, fileToSource } from "@/lib/extraction/read-file";
import { normalizeExtraction } from "@/lib/extraction/normalize";
import { DEMO_RAW } from "../../scripts/demo-raw-extractions";
import { resetRateLimit } from "@/lib/rate-limit";
import { POST } from "@/app/api/extract/route";

const spring = getTempleSemester("spring-2027");
const sample = (f: string) => new Uint8Array(fs.readFileSync(path.join(process.cwd(), "public", "sample-syllabi", f)));

describe("file validation (extension + magic bytes)", () => {
  it("accepts the real samples", () => {
    expect(detectKind("a.pdf", sample("intro-statistics.pdf"))).toBe("pdf");
    expect(detectKind("a.docx", sample("business-writing.docx"))).toBe("docx");
    expect(detectKind("a.txt", sample("risk-management.txt"))).toBe("txt");
  });
  it("rejects mismatched or unsupported files with plain language", () => {
    expect(() => detectKind("fake.pdf", new TextEncoder().encode("hello"))).toThrow(FileRejected);
    expect(() => detectKind("fake.docx", sample("intro-statistics.pdf"))).toThrow(/Word/);
    expect(() => detectKind("bin.txt", new Uint8Array([0xff, 0xfe, 0x00, 0x81]))).toThrow(/plain text/);
    expect(() => detectKind("photo.png", new Uint8Array([0x89, 0x50]))).toThrow(/PDF, Word/);
    expect(() => detectKind("big.pdf", new Uint8Array(4 * 1024 * 1024 + 1))).toThrow(/4 MB/);
  });
  it("converts DOCX to text with mammoth", async () => {
    const src = await fileToSource("business-writing.docx", sample("business-writing.docx"));
    expect(src.kind).toBe("text");
    if (src.kind === "text") expect(src.text).toContain("Research Paper");
  });
});

describe("prompt and schema", () => {
  it("treats the syllabus as untrusted data", () => {
    expect(SYSTEM_PROMPT).toMatch(/untrusted data/);
    expect(SYSTEM_PROMPT).toMatch(/ignore that text completely/);
    expect(RECORD_TOOL.name).toBe("record_syllabus_items");
  });
  it("hand-transcribed raw outputs validate against the zod schema", () => {
    for (const raw of Object.values(DEMO_RAW)) expect(SyllabusExtractionSchema.safeParse(raw).success).toBe(true);
  });
  it("rejects malformed tool output", () => {
    expect(SyllabusExtractionSchema.safeParse({ course: {}, items: [{ title: "x" }] }).success).toBe(false);
  });
});

describe("normalization", () => {
  const raw = (items: unknown[], meetingDays: string[] | null = null) =>
    SyllabusExtractionSchema.parse({ course: { code: "T 1", title: null, meetingDays }, items, warnings: [] });
  const base = { weightPercent: null, groupWeight: null, confidence: "high", note: null };

  it("resolves Week N with and without days and meeting days", () => {
    const r = normalizeExtraction(
      raw(
        [
          { ...base, title: "A", type: "exam", date: { kind: "relative", isoDate: null, week: 9, dayOfWeek: null, rawText: "Week 9" } },
          { ...base, title: "B", type: "exam", date: { kind: "relative", isoDate: null, week: 9, dayOfWeek: "Wed", rawText: "Week 9 Wednesday" } },
        ],
        ["Tue", "Thu"],
      ),
      spring,
    );
    expect(r.items[0].dueDate).toBe("2027-03-09");
    expect(r.items[0].flags).toContain("calculated");
    expect(r.items[0].systemNotes[0]).toBe('Calculated from "Week 9".');
    expect(r.items[1].dueDate).toBe("2027-03-10");
    expect(r.items[1].flags).not.toContain("calculated");
  });
  it("flags a Week N date that lands on a no-class day", () => {
    const r = normalizeExtraction(
      raw([{ ...base, title: "Q", type: "quiz", date: { kind: "relative", isoDate: null, week: 2, dayOfWeek: null, rawText: "Week 2" } }], ["Mon", "Wed"]),
      spring,
    );
    expect(r.items[0].dueDate).toBe("2027-01-18");
    expect(r.items[0].flags).toEqual(["no-class-day", "missing-weight"]);
  });
  it("splits group weights evenly, and keeps a single undated group row whole", () => {
    const g = { groupName: "Quizzes", totalPercent: 12, count: null };
    const r = normalizeExtraction(
      raw([
        { ...base, title: "Q1", type: "quiz", groupWeight: g, date: { kind: "absolute", isoDate: "2027-02-02", week: null, dayOfWeek: null, rawText: "Feb 2" } },
        { ...base, title: "Q2", type: "quiz", groupWeight: g, date: { kind: "absolute", isoDate: "2027-02-09", week: null, dayOfWeek: null, rawText: "Feb 9" } },
        { ...base, title: "Q3", type: "quiz", groupWeight: g, date: { kind: "absolute", isoDate: "2027-02-16", week: null, dayOfWeek: null, rawText: "Feb 16" } },
        { ...base, title: "Labs", type: "lab", groupWeight: { groupName: "Labs", totalPercent: 10, count: 10 }, date: { kind: "tbd", isoDate: null, week: null, dayOfWeek: null, rawText: "weekly" } },
      ]),
      spring,
    );
    expect(r.items.slice(0, 3).map((i) => i.weightPercent)).toEqual([4, 4, 4]);
    expect(r.items[3].weightPercent).toBe(10);
  });
  it("flags unparseable and out-of-semester dates", () => {
    const r = normalizeExtraction(
      raw([
        { ...base, title: "X", type: "paper", weightPercent: 10, date: { kind: "absolute", isoDate: "Feb 30", week: null, dayOfWeek: null, rawText: "Feb 30" } },
        { ...base, title: "Y", type: "paper", weightPercent: 10, date: { kind: "absolute", isoDate: "2027-08-01", week: null, dayOfWeek: null, rawText: "Aug 1" } },
      ]),
      spring,
    );
    expect(r.items[0].flags).toEqual(["unparseable"]);
    expect(r.items[1].flags).toEqual(["outside-semester"]);
  });
  it("the prompt-injection line has no effect on the risk-management fixture", () => {
    const r = normalizeExtraction(DEMO_RAW["risk-management"], spring);
    expect(r.items.some((i) => /clear/i.test(i.title))).toBe(false);
    expect(r.items.filter((i) => i.type === "exam")).toHaveLength(2);
  });
});

describe("POST /api/extract (mock mode)", () => {
  beforeEach(() => {
    process.env.OWLCAST_MOCK_AI = "1";
    process.env.OWLCAST_MOCK_DELAY_MS = "0";
    resetRateLimit();
  });
  const upload = (name: string, bytes: Uint8Array, ip = "1.1.1.1") => {
    const form = new FormData();
    form.set("file", new File([bytes as BlobPart], name));
    form.set("semesterId", "spring-2027");
    return new NextRequest("http://localhost/api/extract", { method: "POST", body: form, headers: { "x-forwarded-for": ip } });
  };

  it("returns the matching fixture for a demo file", async () => {
    const res = await POST(upload("information-systems.pdf", sample("information-systems.pdf")));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.course.code).toBe("MIS 1050");
    expect(body.items.find((i: { title: string }) => i.title === "Group Project Milestone").dueDate).toBe("2027-02-26");
  });
  it("rejects a fake PDF with a friendly 400", async () => {
    const res = await POST(upload("syllabus.pdf", new TextEncoder().encode("not a pdf")));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/real PDF/);
  });
  it("accepts pasted JSON text and validates semester input", async () => {
    const ok = await POST(
      new NextRequest("http://localhost/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "Midterm Feb 10 25%", semesterId: "spring-2027" }),
      }),
    );
    expect(ok.status).toBe(200);
    const bad = await POST(
      new NextRequest("http://localhost/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "x", semesterId: "custom", semesterStart: "2027-05-01", semesterEnd: "2027-01-01" }),
      }),
    );
    expect(bad.status).toBe(400);
    expect(Object.keys(await bad.json())).toEqual(["error"]);
  });
  it("rate-limits after 20 requests in 10 minutes", async () => {
    for (let i = 0; i < 20; i++) expect((await POST(upload("risk-management.txt", sample("risk-management.txt"), "9.9.9.9"))).status).toBe(200);
    const res = await POST(upload("risk-management.txt", sample("risk-management.txt"), "9.9.9.9"));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
  });
});
