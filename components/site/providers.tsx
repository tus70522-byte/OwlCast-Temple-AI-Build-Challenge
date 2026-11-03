"use client";

import { MotionConfig } from "motion/react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider>
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            classNames: {
              toast:
                "!rounded-xl !border !border-line !bg-ink !text-white !shadow-lift !text-base !font-sans",
              description: "!text-white/85",
              actionButton: "!bg-white !text-ink !font-semibold !rounded-lg !min-h-9 !px-3",
            },
          }}
        />
      </TooltipProvider>
    </MotionConfig>
  );
}
