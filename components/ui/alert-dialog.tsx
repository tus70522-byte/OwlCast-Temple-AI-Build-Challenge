"use client";

import * as React from "react";
import { AlertDialog as AD } from "radix-ui";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

export const AlertDialog = AD.Root;
export const AlertDialogTrigger = AD.Trigger;

export function AlertDialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AD.Content>) {
  return (
    <AD.Portal>
      <AD.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px]" />
      <AD.Content
        className={cn(
          "card fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 p-6 shadow-lift",
          className,
        )}
        {...props}
      >
        {children}
      </AD.Content>
    </AD.Portal>
  );
}

export function AlertDialogTitle({ className, ...props }: React.ComponentProps<typeof AD.Title>) {
  return <AD.Title className={cn("font-display text-2xl font-semibold text-ink", className)} {...props} />;
}

export function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AD.Description>) {
  return <AD.Description className={cn("mt-2 text-ink-muted", className)} {...props} />;
}

export function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end", className)} {...props} />;
}

export function AlertDialogCancel({ className, ...props }: React.ComponentProps<typeof AD.Cancel>) {
  return <AD.Cancel className={cn(buttonVariants({ variant: "secondary" }), className)} {...props} />;
}

export function AlertDialogAction({ className, ...props }: React.ComponentProps<typeof AD.Action>) {
  return <AD.Action className={cn(buttonVariants({ variant: "danger" }), className)} {...props} />;
}
