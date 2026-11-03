import { Cloud, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/** Friendly weather-style loading indicator (never a bare spinner). */
export function WeatherLoader({ label = "Reading your syllabus…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)} role="status">
      <span className="relative inline-flex size-10 items-center justify-center" aria-hidden="true">
        <Sun className="absolute top-0.5 right-0.5 size-5 text-[#C98A00] animate-pulse-soft" />
        <Cloud className="absolute bottom-0.5 left-0 size-7 fill-surface text-ink-muted animate-drift" strokeWidth={2} />
      </span>
      <span className="font-medium text-ink">{label}</span>
    </div>
  );
}
