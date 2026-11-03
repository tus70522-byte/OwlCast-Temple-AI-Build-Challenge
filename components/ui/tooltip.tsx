"use client";

import * as React from "react";
import { Tooltip as TT } from "radix-ui";
import { cn } from "@/lib/utils";

export const TooltipProvider = TT.Provider;

export function Tooltip({
  content,
  children,
  side = "top",
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <TT.Root delayDuration={150}>
      <TT.Trigger asChild>{children}</TT.Trigger>
      <TT.Portal>
        <TT.Content
          side={side}
          sideOffset={6}
          className={cn("z-50 max-w-64 rounded-lg bg-ink px-3 py-2 text-sm leading-snug text-white shadow-lift")}
        >
          {content}
          <TT.Arrow className="fill-ink" />
        </TT.Content>
      </TT.Portal>
    </TT.Root>
  );
}
