import * as React from "react";
import { cn } from "@/lib/utils";

export const inputClass =
  "min-h-11 w-full rounded-xl border border-line-strong bg-surface px-3.5 text-base text-ink tabular placeholder:text-ink-muted/80 transition-colors hover:border-ink-muted aria-[invalid=true]:border-cherry aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-cherry";

export const selectClass = cn(
  inputClass,
  "appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2355565A' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-9",
);

export function FieldError({ id, children }: { id: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1.5 text-[15px] font-medium text-cherry-dark">
      {children}
    </p>
  );
}

export function StepHeader({ title, description, id }: { title: string; description: React.ReactNode; id?: string }) {
  return (
    <div className="mb-8">
      <h2 id={id} tabIndex={-1} className="font-display text-[2rem] leading-tight font-semibold tracking-tight outline-none sm:text-[2.4rem]">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-lg text-ink-muted">{description}</p>
    </div>
  );
}
