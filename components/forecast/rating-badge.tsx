import { CloudLightning, CloudSun, GraduationCap, Palmtree, Sun, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type BadgeKind = "clear" | "busy" | "storm" | "break" | "finals";

export const RATING_META: Record<
  BadgeKind,
  { label: string; Icon: LucideIcon; fg: string; bg: string; bar: string; text: string }
> = {
  clear: { label: "Clear", Icon: Sun, fg: "#1E6B2E", bg: "#E9F5EC", bar: "#5FAE72", text: "text-clear-fg" },
  busy: { label: "Busy", Icon: CloudSun, fg: "#7A4F00", bg: "#FFF3D6", bar: "#E0A526", text: "text-busy-fg" },
  storm: { label: "Storm", Icon: CloudLightning, fg: "#9D2235", bg: "#F7E8EA", bar: "#9D2235", text: "text-storm-fg" },
  break: { label: "Break", Icon: Palmtree, fg: "#3F4A5A", bg: "#EEF1F5", bar: "#AEB8C6", text: "text-break-fg" },
  finals: { label: "Finals", Icon: GraduationCap, fg: "#FFFFFF", bg: "#7A1A29", bar: "#7A1A29", text: "text-white" },
};

export function RatingBadge({
  kind,
  size = "md",
  className,
}: {
  kind: BadgeKind;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const meta = RATING_META[kind];
  const { Icon } = meta;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap",
        size === "sm" && "px-2.5 py-0.5 text-sm",
        size === "md" && "px-3 py-1 text-[15px]",
        size === "lg" && "px-3.5 py-1.5 text-base",
        className,
      )}
      style={{ color: meta.fg, backgroundColor: meta.bg }}
    >
      <Icon className={cn(size === "lg" ? "size-5" : "size-4")} aria-hidden="true" strokeWidth={2.25} />
      {meta.label}
    </span>
  );
}
