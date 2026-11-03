import mammoth from "mammoth";
import type { SyllabusSource } from "@/lib/ai/extract";

export const MAX_FILE_BYTES = 4 * 1024 * 1024;
export const MAX_TEXT_CHARS = 100_000;

export class FileRejected extends Error {}

type Kind = "pdf" | "docx" | "txt";

function extensionOf(name: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(name);
  return m ? m[1].toLowerCase() : "";
}

/** Check type by extension AND magic bytes. Throws FileRejected with a plain-language reason. */
export function detectKind(name: string, bytes: Uint8Array): Kind {
  const ext = extensionOf(name);
  if (bytes.length === 0) throw new FileRejected("This file is empty.");
  if (bytes.length > MAX_FILE_BYTES) throw new FileRejected("This file is over 4 MB. Try a smaller file or paste the text instead.");

  const startsWith = (sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (ext === "pdf") {
    if (!startsWith([0x25, 0x50, 0x44, 0x46])) throw new FileRejected("This doesn't look like a real PDF. Try exporting it again.");
    return "pdf";
  }
  if (ext === "docx") {
    if (!startsWith([0x50, 0x4b, 0x03, 0x04])) throw new FileRejected("This doesn't look like a real Word (.docx) file.");
    return "docx";
  }
  if (ext === "txt") {
    try {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      if (text.includes("\u0000")) throw new Error("binary");
    } catch {
      throw new FileRejected("This text file isn't readable as plain text (UTF-8).");
    }
    return "txt";
  }
  throw new FileRejected("OwlCast reads PDF, Word (.docx), and plain text (.txt) files.");
}

/** Turn an uploaded file into what we send to the AI. Content is never stored or logged. */
export async function fileToSource(name: string, bytes: Uint8Array): Promise<SyllabusSource> {
  const kind = detectKind(name, bytes);
  if (kind === "pdf") return { kind: "pdf", base64: Buffer.from(bytes).toString("base64") };
  let text: string;
  if (kind === "docx") {
    try {
      const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
      text = result.value;
    } catch {
      throw new FileRejected("We couldn't open this Word file. Try saving it as PDF.");
    }
  } else {
    text = new TextDecoder("utf-8").decode(bytes);
  }
  text = text.trim();
  if (!text) throw new FileRejected("We couldn't find any text in this file.");
  if (text.length > MAX_TEXT_CHARS) throw new FileRejected("This file has more than 100,000 characters of text. Try just the grading and schedule sections.");
  return { kind: "text", text };
}
