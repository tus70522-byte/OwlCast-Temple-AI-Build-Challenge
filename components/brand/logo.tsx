import { cn } from "@/lib/utils";

/**
 * OwlCast mark: an original, minimal owl face (two eyes looking up and ahead + a beak)
 * on a cherry tile. Not derived from any Temple University mark.
 */
export function OwlMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <rect width="32" height="32" rx="9" fill="#9D2235" />
      <circle cx="10.5" cy="14" r="6" fill="#FFFFFF" />
      <circle cx="21.5" cy="14" r="6" fill="#FFFFFF" />
      <circle cx="11.6" cy="12.6" r="2.6" fill="#1A1A1A" />
      <circle cx="22.6" cy="12.6" r="2.6" fill="#1A1A1A" />
      <path d="M14 21.5h4L16 25.5z" fill="#F7E8EA" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <OwlMark />
      <span className="font-display text-[1.65rem] leading-none font-semibold tracking-tight text-cherry">
        OwlCast
      </span>
    </span>
  );
}
