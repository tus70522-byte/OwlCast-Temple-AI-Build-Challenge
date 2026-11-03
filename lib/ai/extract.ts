import Anthropic from "@anthropic-ai/sdk";
import type { Semester } from "@/lib/calendar/semester";
import { RECORD_TOOL, SYSTEM_PROMPT, TOOL_NAME, buildSemesterContext } from "./extraction-prompt";
import { SyllabusExtractionSchema, type SyllabusExtraction } from "./schema";

export type SyllabusSource =
  | { kind: "pdf"; base64: string }
  | { kind: "text"; text: string };

export class ExtractionError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

const TIMEOUT_MS = 55_000;
const MAX_TOKENS = 8_000;

export function getModel(): string {
  return process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-5-5";
}

/**
 * Ask Claude to read the syllabus and call `record_syllabus_items`.
 * Output is validated with zod; on failure we retry once, then give up with a friendly error.
 */
export async function extractWithClaude(
  source: SyllabusSource,
  semester: Semester,
  courseName?: string | null,
): Promise<{ data: SyllabusExtraction; usage: { inputTokens: number; outputTokens: number } }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new ExtractionError("Syllabus reading isn't set up on this server yet. Try the demo syllabi instead.", 503);
  }
  const client = new Anthropic({ apiKey, maxRetries: 1, timeout: TIMEOUT_MS });
  const deadline = Date.now() + TIMEOUT_MS;

  const documentBlock: Anthropic.ContentBlockParam =
    source.kind === "pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: source.base64 } }
      : { type: "document", source: { type: "text", media_type: "text/plain", data: source.text }, title: "Syllabus" };

  const usage = { inputTokens: 0, outputTokens: 0 };
  let strict = true;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining < 3_000) break;
    try {
      const message = await client.messages.create(
        {
          model: getModel(),
          max_tokens: MAX_TOKENS,
          system: SYSTEM_PROMPT,
          // Extraction is a reading task; low effort keeps latency down for live demos.
          thinking: { type: "adaptive" },
          output_config: { effort: "low" },
          tools: [{ ...RECORD_TOOL, strict }],
          // Current models reject forced tool_choice, so we use auto + a prompt instruction.
          tool_choice: { type: "auto" },
          messages: [
            {
              role: "user",
              content: [documentBlock, { type: "text", text: buildSemesterContext(semester, courseName) }],
            },
          ],
        },
        { timeout: remaining },
      );
      usage.inputTokens += message.usage.input_tokens;
      usage.outputTokens += message.usage.output_tokens;

      if (message.stop_reason === "refusal") {
        throw new ExtractionError("We couldn't read this file. Try pasting the grading and schedule sections as text.", 422);
      }
      const toolUse = message.content.find(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === TOOL_NAME,
      );
      const parsed = SyllabusExtractionSchema.safeParse(toolUse?.input);
      if (parsed.success) return { data: parsed.data, usage };
      // fall through to retry
    } catch (err) {
      if (err instanceof ExtractionError) throw err;
      if (err instanceof Anthropic.BadRequestError && strict) {
        // Some accounts/models may not accept strict tool schemas; retry without it.
        strict = false;
        continue;
      }
      if (err instanceof Anthropic.RateLimitError) {
        throw new ExtractionError("Our syllabus reader is busy right now. Wait a minute and try again.", 503);
      }
      if (err instanceof Anthropic.APIConnectionTimeoutError) {
        throw new ExtractionError("Reading this syllabus took too long. Try again, or paste just the schedule and grading sections.", 504);
      }
      if (err instanceof Anthropic.APIError) {
        throw new ExtractionError("We couldn't reach our syllabus reader. Try again in a moment.", 502);
      }
      throw new ExtractionError("Something went wrong while reading this syllabus. Try again.", 502);
    }
  }
  throw new ExtractionError(
    "We read the file but couldn't make sense of the results. Try again, or paste the grading and schedule sections as text.",
    502,
  );
}
