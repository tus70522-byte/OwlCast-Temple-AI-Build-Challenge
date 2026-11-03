import Link from "next/link";
import {
  CalendarPlus,
  ClipboardCheck,
  CloudSun,
  EyeOff,
  FileUp,
  PlayCircle,
  ShieldCheck,
  UserCheck,
  Accessibility,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroForecast } from "@/components/landing/hero-forecast";

const STEPS = [
  {
    Icon: FileUp,
    title: "Upload syllabi",
    body: "Drop in PDFs, Word files, or pasted text for every course you're taking.",
  },
  {
    Icon: ClipboardCheck,
    title: "Confirm what we found",
    body: "Check every exam, paper, and project. Anything uncertain is flagged for you.",
  },
  {
    Icon: CloudSun,
    title: "Get your forecast",
    body: "See each week rated Clear, Busy, or Storm, with start dates for the big items.",
  },
  {
    Icon: CalendarPlus,
    title: "Add it to your calendar",
    body: "Export to Google, Apple, or Outlook Calendar, or print a one-page plan.",
  },
];

const PRINCIPLES = [
  {
    Icon: UserCheck,
    title: "You stay in control",
    body: "Nothing is forecast until you've checked what the AI read.",
  },
  {
    Icon: EyeOff,
    title: "Nothing is stored",
    body: "Files are read and discarded. Your plan stays in your browser.",
  },
  {
    Icon: Accessibility,
    title: "Built for everyone",
    body: "Keyboard and screen-reader friendly, high contrast, never color alone.",
  },
];

export default function Home() {
  return (
    <>
      <section className="mx-auto grid max-w-[1120px] items-center gap-12 px-4 pt-12 pb-16 sm:px-6 md:pt-20 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-[15px] font-medium text-ink-muted">
            <span className="size-2 rounded-full bg-cherry" aria-hidden="true" />
            The forecast for your semester
          </p>
          <h1 className="font-display text-[2.6rem] leading-[1.04] font-semibold tracking-tight text-ink sm:text-6xl lg:text-[4.25rem]">
            See your hardest week before it sees you.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-muted sm:text-xl">
            Upload your syllabi. OwlCast forecasts every week of your semester and tells you when to start, so the
            big weeks never catch you off guard.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/plan">Build my forecast</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/plan?demo=1">
                <PlayCircle className="size-5" aria-hidden="true" />
                Watch the demo
              </Link>
            </Button>
          </div>
        </div>
        <HeroForecast />
      </section>

      <section aria-labelledby="how-heading" className="border-y border-line bg-surface">
        <div className="mx-auto max-w-[1120px] px-4 py-16 sm:px-6 md:py-20">
          <h2 id="how-heading" className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {STEPS.map(({ Icon, title, body }, i) => (
              <li key={title} className="relative">
                <div className="flex items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-cherry-light text-cherry">
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <span className="text-[15px] font-semibold text-ink-muted tabular">Step {i + 1}</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-ink-muted">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="why-heading" className="mx-auto max-w-[1120px] px-4 py-16 sm:px-6 md:py-24">
        <div className="grid gap-8 md:grid-cols-[auto_1fr] md:items-start md:gap-14">
          <h2 id="why-heading" className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Why it matters
          </h2>
          <div className="max-w-2xl">
            <p className="font-display text-2xl leading-snug text-ink sm:text-[1.9rem]">
              Temple&rsquo;s first-year retention fell from about 90% a decade ago to 77% this fall. Overloaded weeks
              are one reason students fall behind.
            </p>
            <p className="mt-4 text-sm text-ink-muted">
              Source:{" "}
              <a
                href="https://www.inquirer.com/"
                className="underline underline-offset-2 hover:text-ink"
                target="_blank"
                rel="noopener noreferrer"
              >
                The Philadelphia Inquirer, Oct 5, 2026
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="responsible-heading" className="mx-auto max-w-[1120px] px-4 sm:px-6">
        <div className="card overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-line p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-7 text-cherry" aria-hidden="true" />
              <h2 id="responsible-heading" className="font-display text-3xl font-semibold tracking-tight">
                Built responsibly
              </h2>
            </div>
            <Link
              href="/responsible"
              className="inline-flex min-h-11 items-center font-semibold text-cherry underline-offset-4 hover:underline"
            >
              Read how OwlCast uses AI
            </Link>
          </div>
          <ul className="grid divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
            {PRINCIPLES.map(({ Icon, title, body }) => (
              <li key={title} className="p-6 sm:p-8">
                <Icon className="size-6 text-ink" aria-hidden="true" />
                <h3 className="mt-3 text-lg font-semibold">{title}</h3>
                <p className="mt-1 text-ink-muted">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
