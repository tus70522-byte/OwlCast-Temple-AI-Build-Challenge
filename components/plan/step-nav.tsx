import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StepNav({
  onBack,
  backLabel = "Back",
  children,
}: {
  onBack?: () => void;
  backLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="no-print mt-12 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
      {onBack ? (
        <Button variant="ghost" onClick={onBack} className="self-start">
          <ArrowLeft className="size-5" aria-hidden="true" />
          {backLabel}
        </Button>
      ) : (
        <span />
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">{children}</div>
    </div>
  );
}
