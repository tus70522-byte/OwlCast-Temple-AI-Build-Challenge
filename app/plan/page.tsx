import type { Metadata } from "next";
import { Suspense } from "react";
import { PlanWizard } from "@/components/plan/plan-wizard";
import { WizardSkeleton } from "@/components/plan/wizard-skeleton";

export const metadata: Metadata = {
  title: "Build your forecast",
  description: "Upload your syllabi, confirm what OwlCast found, and get a week-by-week forecast of your semester.",
};

export default function PlanPage() {
  return (
    <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
      <h1 className="sr-only">Build your semester forecast</h1>
      <Suspense fallback={<WizardSkeleton />}>
        <PlanWizard />
      </Suspense>
    </div>
  );
}
