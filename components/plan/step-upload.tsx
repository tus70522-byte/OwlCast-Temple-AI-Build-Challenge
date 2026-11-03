"use client";

import { useId, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardPaste,
  FileText,
  FileType2,
  Loader,
  RotateCcw,
  Sparkles,
  UploadCloud,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, StepHeader, inputClass } from "@/components/ui/field";
import { DEMO_FILES, DEMO_FIXTURES } from "@/lib/extraction/fixtures";
import {
  ACCEPTED_EXTENSIONS,
  ClientExtractionError,
  DEMO_TIMEOUT_MS,
  MAX_FILES,
  extractFile,
  extractText,
  precheckFile,
  runWithConcurrency,
} from "@/lib/plan/extract-client";
import { getSemesterFromState, usePlanStore, type Upload } from "@/lib/plan/store";
import { cn, pluralize } from "@/lib/utils";
import { StepNav } from "./step-nav";
import { WeatherLoader } from "./weather-loader";

// Kept in memory (not persisted) so failed reads can be retried.
const pendingFiles = new Map<string, File>();
const pendingTexts = new Map<string, { text: string; courseName: string }>();

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function StepUpload({ demoHighlight, onBack, onNext }: { demoHighlight: boolean; onBack: () => void; onNext: () => void }) {
  const uploads = usePlanStore((s) => s.uploads);
  const store = usePlanStore;
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pasteCourse, setPasteCourse] = useState("");
  const [pasteError, setPasteError] = useState<string>();
  const uid = useId();

  const doneCount = uploads.filter((u) => u.status === "done").length;
  const reading = uploads.some((u) => u.status === "reading" || u.status === "waiting");
  const totalItems = uploads.reduce((n, u) => n + (u.status === "done" ? (u.itemCount ?? 0) : 0), 0);

  const semester = () => getSemesterFromState(store.getState());
  const announce = (m: string) => store.getState().announce(m);

  async function readFile(uploadId: string, file: File) {
    const s = semester();
    if (!s) return;
    store.getState().updateUpload(uploadId, { status: "reading", error: undefined });
    announce(`Reading ${file.name}.`);
    try {
      const result = await extractFile(file, s);
      store.getState().applyExtraction(uploadId, result, file.name, false);
      pendingFiles.delete(uploadId);
      announce(`${file.name}: ${pluralize(result.items.length, "item")} found.`);
    } catch (e) {
      const err = e instanceof ClientExtractionError ? e : new ClientExtractionError("Something went wrong. Try again.", true);
      store.getState().updateUpload(uploadId, { status: "error", error: err.message, retryable: err.retryable });
      announce(`${file.name}: ${err.message}`);
    }
  }

  function addFiles(list: FileList | File[]) {
    const files = Array.from(list);
    if (!files.length) return;
    const existing = store.getState().uploads.length;
    const room = Math.max(0, MAX_FILES - existing);
    if (files.length > room) {
      toast.error(`You can add up to ${MAX_FILES} syllabi. ${room === 0 ? "Remove one to add another." : `Only the first ${room} were added.`}`);
    }
    const tasks: (() => Promise<void>)[] = [];
    for (const file of files.slice(0, room)) {
      const problem = precheckFile(file);
      const id = store.getState().addUpload({
        name: file.name,
        size: file.size,
        kind: "file",
        status: problem ? "error" : "waiting",
        error: problem ?? undefined,
        retryable: false,
      });
      if (!problem) {
        pendingFiles.set(id, file);
        tasks.push(() => readFile(id, file));
      } else announce(`${file.name}: ${problem}`);
    }
    void runWithConcurrency(tasks, 4);
  }

  function ensureSpringForDemo() {
    const st = store.getState();
    if (st.semesterChoice !== "spring-2027") {
      st.setSemesterChoice("spring-2027");
      toast("The demo syllabi are for Spring 2027, so we switched your semester.");
    }
  }

  function clearDemoUploads() {
    const st = store.getState();
    st.uploads.filter((u) => u.kind === "demo").forEach((u) => st.removeUpload(u.id));
  }

  async function readDemo(uploadId: string, stem: string, file: string) {
    const st = store.getState();
    st.updateUpload(uploadId, { status: "reading", error: undefined });
    try {
      const res = await fetch(`/sample-syllabi/${file}`);
      if (!res.ok) throw new Error("missing");
      const blob = await res.blob();
      const s = semester();
      if (!s) throw new Error("no semester");
      const result = await extractFile(new File([blob], file), s, DEMO_TIMEOUT_MS);
      store.getState().applyExtraction(uploadId, result, file, false);
      announce(`${file}: ${pluralize(result.items.length, "item")} found.`);
    } catch {
      // Live read failed or took over 25 seconds: use the saved, verified demo result.
      store.getState().applyExtraction(uploadId, DEMO_FIXTURES[stem], file, true);
      announce(`${file}: loaded saved demo result.`);
    }
  }

  function runDemo(live: boolean) {
    ensureSpringForDemo();
    clearDemoUploads();
    const tasks: (() => Promise<void>)[] = [];
    for (const d of DEMO_FILES) {
      const id = store.getState().addUpload({ name: d.file, size: 0, kind: "demo", status: live ? "waiting" : "reading" });
      if (live) tasks.push(() => readDemo(id, d.stem, d.file));
      else store.getState().applyExtraction(id, DEMO_FIXTURES[d.stem], d.file, true);
    }
    if (live) {
      announce("Reading 4 demo syllabi.");
      void runWithConcurrency(tasks, 4);
    } else {
      announce("Loaded 4 saved demo syllabi.");
    }
  }

  async function readPasted(uploadId: string, text: string, courseName: string) {
    const s = semester();
    if (!s) return;
    store.getState().updateUpload(uploadId, { status: "reading", error: undefined });
    try {
      const result = await extractText(text, courseName, s);
      if (courseName && !result.course.code && !result.course.title) result.course.title = courseName;
      store.getState().applyExtraction(uploadId, result, courseName || "Pasted syllabus", false);
      pendingTexts.delete(uploadId);
      announce(`${courseName || "Pasted syllabus"}: ${pluralize(result.items.length, "item")} found.`);
    } catch (e) {
      const err = e instanceof ClientExtractionError ? e : new ClientExtractionError("Something went wrong. Try again.", true);
      store.getState().updateUpload(uploadId, { status: "error", error: err.message, retryable: err.retryable });
    }
  }

  function submitPaste(e: React.FormEvent) {
    e.preventDefault();
    const text = pasteText.trim();
    if (!text) return setPasteError("Paste the syllabus text first.");
    if (text.length > 100_000) return setPasteError("That's over 100,000 characters. Paste just the grading and schedule sections.");
    if (store.getState().uploads.length >= MAX_FILES) return setPasteError(`You can add up to ${MAX_FILES} syllabi. Remove one first.`);
    setPasteError(undefined);
    const name = pasteCourse.trim() || "Pasted syllabus";
    const id = store.getState().addUpload({ name, size: text.length, kind: "paste", status: "waiting" });
    pendingTexts.set(id, { text, courseName: pasteCourse.trim() });
    void readPasted(id, text, pasteCourse.trim());
    setPasteText("");
    setPasteCourse("");
    setPasteOpen(false);
  }

  function retry(u: Upload) {
    if (u.kind === "demo") {
      const d = DEMO_FILES.find((x) => x.file === u.name);
      if (d) void readDemo(u.id, d.stem, d.file);
      return;
    }
    const file = pendingFiles.get(u.id);
    if (file) return void readFile(u.id, file);
    const pasted = pendingTexts.get(u.id);
    if (pasted) return void readPasted(u.id, pasted.text, pasted.courseName);
  }

  function remove(u: Upload) {
    store.getState().removeUpload(u.id);
    pendingFiles.delete(u.id);
    pendingTexts.delete(u.id);
    announce(`Removed ${u.name}.`);
  }

  return (
    <div>
      <StepHeader
        id="step-heading"
        title="Upload your syllabi"
        description="Add the syllabus for each course. We'll find every graded item, its due date, and its weight."
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            className={cn(
              "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-surface px-6 py-12 text-center transition-colors",
              dragging ? "border-cherry bg-cherry-light/50" : "border-line-strong",
            )}
          >
            <span className="flex size-14 items-center justify-center rounded-2xl bg-cherry-light text-cherry">
              <UploadCloud className="size-7" aria-hidden="true" />
            </span>
            <p className="mt-4 text-xl font-semibold">Drop syllabi here</p>
            <p className="mt-1 text-ink-muted" id={`${uid}-limits`}>
              PDF, Word, or text files. Up to {MAX_FILES} files, 4 MB each.
            </p>
            <input
              ref={inputRef}
              id={`${uid}-file`}
              type="file"
              multiple
              accept={ACCEPTED_EXTENSIONS.join(",")}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <Button className="mt-5" onClick={() => inputRef.current?.click()} aria-describedby={`${uid}-limits`}>
              <FileText className="size-5" aria-hidden="true" />
              Choose files
            </Button>
            <button
              type="button"
              className="mt-3 inline-flex min-h-11 items-center gap-1.5 font-semibold text-cherry underline-offset-4 hover:underline"
              aria-expanded={pasteOpen}
              aria-controls={`${uid}-paste`}
              onClick={() => setPasteOpen((v) => !v)}
            >
              <ClipboardPaste className="size-4.5" aria-hidden="true" />
              Paste syllabus text instead
            </button>
          </div>

          {pasteOpen && (
            <form id={`${uid}-paste`} onSubmit={submitPaste} className="card mt-4 p-5" noValidate>
              <label htmlFor={`${uid}-course`} className="mb-1.5 block font-semibold">
                Course name <span className="font-normal text-ink-muted">(optional)</span>
              </label>
              <input
                id={`${uid}-course`}
                className={inputClass}
                value={pasteCourse}
                maxLength={120}
                placeholder="e.g. PSY 1001 Intro to Psychology"
                onChange={(e) => setPasteCourse(e.target.value)}
              />
              <label htmlFor={`${uid}-text`} className="mt-4 mb-1.5 block font-semibold">
                Syllabus text
              </label>
              <textarea
                id={`${uid}-text`}
                className={cn(inputClass, "min-h-44 py-3 leading-relaxed")}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                aria-invalid={Boolean(pasteError)}
                aria-describedby={pasteError ? `${uid}-text-err` : undefined}
                placeholder="Paste the grading breakdown and course schedule here."
              />
              <FieldError id={`${uid}-text-err`}>{pasteError}</FieldError>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button type="submit">Read this text</Button>
                <Button type="button" variant="ghost" onClick={() => setPasteOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>

        <aside
          aria-labelledby={`${uid}-demo`}
          className={cn("card flex flex-col p-6", demoHighlight && "border-2 border-cherry shadow-lift ring-4 ring-cherry-light")}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-cherry" aria-hidden="true" />
            <h3 id={`${uid}-demo`} className="text-xl font-semibold">
              No syllabi handy?
            </h3>
          </div>
          <p className="mt-2 text-ink-muted">
            Try four fictional Spring 2027 syllabi: a PDF with a schedule table, a PDF with &ldquo;Week N&rdquo; dates, a Word file, and a
            plain-text file.
          </p>
          <Button size="lg" className="mt-5 w-full" onClick={() => runDemo(true)} disabled={reading}>
            Try with demo syllabi
          </Button>
          <button
            type="button"
            onClick={() => runDemo(false)}
            disabled={reading}
            aria-describedby={`${uid}-instant-help`}
            className="mt-3 inline-flex min-h-11 items-center justify-center gap-1.5 self-center text-[15px] font-semibold text-ink underline underline-offset-4 hover:text-cherry disabled:opacity-50"
          >
            <Zap className="size-4" aria-hidden="true" />
            Instant demo
          </button>
          <p id={`${uid}-instant-help`} className="text-center text-sm text-ink-muted">
            Loads saved results right away. Works without internet.
          </p>
        </aside>
      </div>

      {uploads.length > 0 && (
        <section aria-labelledby={`${uid}-files`} className="mt-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 id={`${uid}-files`} className="text-xl font-semibold">
              Your syllabi
            </h3>
            {reading ? (
              <WeatherLoader />
            ) : (
              doneCount > 0 && (
                <p className="font-medium text-ink-muted tabular">
                  {pluralize(totalItems, "item")} from {pluralize(doneCount, "course")}
                </p>
              )
            )}
          </div>
          <ul className="card divide-y divide-line">
            {uploads.map((u) => (
              <UploadRow key={u.id} upload={u} onRetry={() => retry(u)} onRemove={() => remove(u)} />
            ))}
          </ul>
        </section>
      )}

      <StepNav onBack={onBack}>
        {doneCount === 0 && (
          <p className="text-[15px] text-ink-muted" id={`${uid}-next-help`}>
            Add at least one syllabus to continue.
          </p>
        )}
        <Button size="lg" onClick={onNext} disabled={doneCount === 0} aria-describedby={doneCount === 0 ? `${uid}-next-help` : undefined}>
          Check what we found
          <ArrowRight className="size-5" aria-hidden="true" />
        </Button>
      </StepNav>
    </div>
  );
}

function UploadRow({ upload: u, onRetry, onRemove }: { upload: Upload; onRetry: () => void; onRemove: () => void }) {
  const Icon = u.kind === "paste" ? ClipboardPaste : u.name.endsWith(".pdf") ? FileType2 : FileText;
  return (
    <li className="flex items-start gap-4 p-4 sm:items-center sm:px-5">
      <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-xl bg-canvas text-ink-muted sm:mt-0">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{u.name}</p>
        <div className="mt-0.5 text-[15px]">
          {u.status === "waiting" && <span className="text-ink-muted">Waiting…</span>}
          {u.status === "reading" && (
            <span className="inline-flex items-center gap-1.5 font-medium text-ink">
              <Loader className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              Reading…
            </span>
          )}
          {u.status === "done" && (
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1.5 font-medium text-clear-fg">
                <CheckCircle2 className="size-4" aria-hidden="true" />
                {pluralize(u.itemCount ?? 0, "item")} found
              </span>
              {u.savedResult && <span className="text-sm text-ink-muted">Loaded saved demo result</span>}
            </span>
          )}
          {u.status === "error" && (
            <span className="inline-flex items-start gap-1.5 font-medium text-cherry-dark">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {u.error}
            </span>
          )}
        </div>
      </div>
      {u.size > 0 && u.kind === "file" && <span className="hidden text-sm text-ink-muted tabular sm:block">{formatSize(u.size)}</span>}
      {u.status === "error" && u.retryable && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Retry
        </Button>
      )}
      <Button variant="ghost" size="icon" onClick={onRemove} aria-label={`Remove ${u.name}`} disabled={u.status === "reading"}>
        <X className="size-5" aria-hidden="true" />
      </Button>
    </li>
  );
}
