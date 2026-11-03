/**
 * Records the saved demo results in data/demo-fixtures/.
 *
 *   npm run record:fixtures            # live: extract the 4 samples with the Anthropic API
 *   npm run record:fixtures -- --offline   # no API key: use the hand-transcribed raw outputs
 *
 * Either way the raw tool output goes through lib/extraction/normalize.ts, so fixtures have
 * exactly the shape /api/extract returns. Always review the diff by hand before committing.
 */
import fs from "node:fs";
import path from "node:path";
import { extractWithClaude, getModel } from "@/lib/ai/extract";
import { getTempleSemester } from "@/lib/calendar/semester";
import { fileToSource } from "@/lib/extraction/read-file";
import { normalizeExtraction, type ExtractionResult } from "@/lib/extraction/normalize";
import { DEMO_RAW } from "./demo-raw-extractions";

const SAMPLES = ["intro-statistics.pdf", "information-systems.pdf", "business-writing.docx", "risk-management.txt"];
const OUT = path.join(process.cwd(), "data", "demo-fixtures");
const semester = getTempleSemester("spring-2027");

// Deterministic ids keep fixture diffs readable.
function idFactory(prefix: string) {
  let n = 0;
  return () => `${prefix}-${String(++n).padStart(2, "0")}`;
}

async function main() {
  const offline = process.argv.includes("--offline") || !process.env.ANTHROPIC_API_KEY;
  fs.mkdirSync(OUT, { recursive: true });
  console.log(offline ? "Offline mode: using hand-transcribed extractions." : `Live mode: ${getModel()}`);

  const names = [...SAMPLES.map((f) => f.replace(/\.[^.]+$/, "")), "generic"];
  for (const stem of names) {
    let result: ExtractionResult;
    if (offline || stem === "generic") {
      const t0 = Date.now();
      const n = normalizeExtraction(DEMO_RAW[stem], semester, idFactory(stem));
      result = { ...n, usage: { inputTokens: 0, outputTokens: 0 }, durationMs: Date.now() - t0 };
    } else {
      const file = SAMPLES.find((f) => f.startsWith(stem))!;
      const bytes = new Uint8Array(fs.readFileSync(path.join(process.cwd(), "public", "sample-syllabi", file)));
      const t0 = Date.now();
      const { data, usage } = await extractWithClaude(await fileToSource(file, bytes), semester);
      const n = normalizeExtraction(data, semester, idFactory(stem));
      result = { ...n, usage, durationMs: Date.now() - t0 };
    }
    fs.writeFileSync(path.join(OUT, `${stem}.json`), JSON.stringify(result, null, 2) + "\n");
    console.log(
      `${stem}: ${result.items.length} items, ${result.usage.inputTokens} in / ${result.usage.outputTokens} out tokens, ${result.durationMs} ms`,
    );
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
