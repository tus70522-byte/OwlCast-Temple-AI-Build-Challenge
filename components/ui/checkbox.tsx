"use client";

import * as React from "react";
import { Checkbox as CB } from "radix-ui";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Radix checkbox wrapped in a 44px hit area. */
export function Checkbox({ className, ...props }: React.ComponentProps<typeof CB.Root>) {
  return (
    <CB.Root
      className={cn(
        "peer relative inline-flex size-6 shrink-0 items-center justify-center rounded-md border-2 border-ink-muted bg-surface transition-colors",
        "before:absolute before:-inset-2.5 before:content-['']",
        "data-[state=checked]:border-cherry data-[state=checked]:bg-cherry data-[state=checked]:text-white",
        className,
      )}
      {...props}
    >
      <CB.Indicator>
        <Check className="size-4" strokeWidth={3} aria-hidden="true" />
      </CB.Indicator>
    </CB.Root>
  );
}
