import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-cherry text-white shadow-sm hover:bg-cherry-dark active:bg-cherry-dark",
        secondary:
          "border border-line-strong bg-surface text-ink hover:border-ink-muted hover:bg-canvas",
        ghost: "text-ink hover:bg-ink/5",
        link: "text-cherry underline-offset-4 hover:underline px-0! min-h-0!",
        danger: "bg-cherry-dark text-white hover:bg-[#5e1420]",
      },
      size: {
        sm: "min-h-11 px-3.5 text-[15px]",
        md: "min-h-11 px-5 text-base",
        lg: "min-h-14 px-7 text-lg",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
