import introStatistics from "@/data/demo-fixtures/intro-statistics.json";
import informationSystems from "@/data/demo-fixtures/information-systems.json";
import businessWriting from "@/data/demo-fixtures/business-writing.json";
import riskManagement from "@/data/demo-fixtures/risk-management.json";
import generic from "@/data/demo-fixtures/generic.json";
import type { ExtractionResult } from "./normalize";

/** Saved, hand-verified extraction results for the 4 bundled demo syllabi. */
export const DEMO_FIXTURES: Record<string, ExtractionResult> = {
  "intro-statistics": introStatistics as ExtractionResult,
  "information-systems": informationSystems as ExtractionResult,
  "business-writing": businessWriting as ExtractionResult,
  "risk-management": riskManagement as ExtractionResult,
};

export const GENERIC_FIXTURE = generic as ExtractionResult;

export const DEMO_FILES = [
  { stem: "intro-statistics", file: "intro-statistics.pdf", label: "Intro to Statistics (PDF)" },
  { stem: "information-systems", file: "information-systems.pdf", label: "Information Systems (PDF)" },
  { stem: "business-writing", file: "business-writing.docx", label: "Business Writing (Word)" },
  { stem: "risk-management", file: "risk-management.txt", label: "Risk Management (text)" },
] as const;

export function fixtureForName(name: string): ExtractionResult {
  const stem = name.toLowerCase().replace(/\.[^.]+$/, "");
  return DEMO_FIXTURES[stem] ?? GENERIC_FIXTURE;
}
