export function WizardSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse-soft">
      <div className="my-4 h-14 rounded-2xl bg-line/60" />
      <div className="mt-10 h-10 w-2/3 max-w-lg rounded-lg bg-line/70" />
      <div className="mt-4 h-6 w-1/2 max-w-md rounded-lg bg-line/50" />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <div className="h-36 rounded-2xl bg-line/50" />
        <div className="h-36 rounded-2xl bg-line/50" />
        <div className="h-36 rounded-2xl bg-line/50" />
      </div>
    </div>
  );
}
