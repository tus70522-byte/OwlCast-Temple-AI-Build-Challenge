"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Step } from "@/lib/plan/store";

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: "Setup" },
  { n: 2, label: "Upload" },
  { n: 3, label: "Confirm" },
  { n: 4, label: "Forecast" },
];

export function StepIndicator({
  current,
  maxReachable,
  onGo,
}: {
  current: Step;
  maxReachable: Step;
  onGo: (s: Step) => void;
}) {
  return (
    <nav aria-label="Forecast steps" className="no-print relative z-30 -mx-4 border-b border-line bg-canvas/90 px-4 backdrop-blur-md sm:sticky sm:top-[65px] sm:mx-0 sm:rounded-b-2xl sm:px-0">
      <ol className="mx-auto flex max-w-[1120px] items-stretch gap-1 py-2 sm:gap-2 sm:px-2">
        {STEPS.map(({ n, label }) => {
          const isCurrent = n === current;
          const done = n < current;
          const reachable = n <= maxReachable;
          return (
            <li key={n} className="flex-1">
              <button
                type="button"
                onClick={() => onGo(n)}
                disabled={!reachable}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-2 text-[15px] font-semibold transition-colors sm:justify-start sm:px-3 sm:text-base",
                  isCurrent && "bg-cherry text-white",
                  !isCurrent && reachable && "text-ink hover:bg-ink/5",
                  !reachable && "cursor-not-allowed text-ink-muted",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-sm tabular",
                    isCurrent && "bg-white text-cherry",
                    !isCurrent && done && "bg-cherry-light text-cherry",
                    !isCurrent && !done && "border border-line-strong bg-surface",
                  )}
                >
                  {done ? <Check className="size-4" strokeWidth={3} /> : n}
                </span>
                <span className="hidden sm:inline">{label}</span>
                <span className="sr-only sm:hidden">{label}</span>
                {done && <span className="sr-only">(completed)</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
