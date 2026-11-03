"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { getSemesterFromState, usePlanStore, type Step } from "@/lib/plan/store";
import { StepIndicator } from "./step-indicator";
import { StepSetup } from "./step-setup";
import { StepUpload } from "./step-upload";
import { StepConfirm } from "./step-confirm";
import { StepForecast } from "./step-forecast";
import { WizardSkeleton } from "./wizard-skeleton";

export function PlanWizard() {
  const params = useSearchParams();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [demoHighlight, setDemoHighlight] = useState(false);

  const step = usePlanStore((s) => s.step);
  const furthest = usePlanStore((s) => s.furthest);
  const setStep = usePlanStore((s) => s.setStep);
  const announcement = usePlanStore((s) => s.announcement);
  const semesterValid = usePlanStore((s) => getSemesterFromState(s) !== null);
  const hasItems = usePlanStore((s) => s.uploads.some((u) => u.status === "done"));

  // Restore saved work, then apply ?demo=1 (fresh Spring 2027 plan, straight to Upload).
  useEffect(() => {
    let cancelled = false;
    const isDemo = params.get("demo") === "1";
    Promise.resolve(usePlanStore.persist.rehydrate()).then(() => {
      if (cancelled) return;
      if (isDemo) {
        const s = usePlanStore.getState();
        s.reset();
        s.setSemesterChoice("spring-2027");
        s.setStep(2);
        setDemoHighlight(true);
        router.replace("/plan", { scroll: false });
      }
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move focus to the new step's heading on step changes (not on first load).
  const prevStep = useRef<Step | null>(null);
  useEffect(() => {
    if (!hydrated) return;
    if (prevStep.current !== null && prevStep.current !== step) {
      window.scrollTo({ top: 0 });
      requestAnimationFrame(() => document.getElementById("step-heading")?.focus({ preventScroll: true }));
    }
    prevStep.current = step;
  }, [step, hydrated]);

  if (!hydrated) return <WizardSkeleton />;

  let maxReachable: Step = 1;
  if (semesterValid) maxReachable = 2;
  if (semesterValid && hasItems) maxReachable = Math.min(4, Math.max(3, furthest)) as Step;

  const go = (s: Step) => {
    if (s <= maxReachable) setStep(s);
  };

  return (
    <div>
      <StepIndicator current={step} maxReachable={maxReachable} onGo={go} />
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.section
          key={step}
          aria-labelledby="step-heading"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="pt-10 sm:pt-12"
        >
          {step === 1 && <StepSetup onNext={() => setStep(2)} />}
          {step === 2 && <StepUpload demoHighlight={demoHighlight} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
          {step === 3 && <StepConfirm onBack={() => setStep(2)} onNext={() => setStep(4)} />}
          {step === 4 && <StepForecast onEdit={() => setStep(3)} />}
        </motion.section>
      </AnimatePresence>
    </div>
  );
}
