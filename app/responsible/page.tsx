import type { Metadata } from "next";
import Link from "next/link";
import { Accessibility, AlertTriangle, Calculator, ShieldCheck, ShieldHalf, UserCheck, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RatingBadge } from "@/components/forecast/rating-badge";
import {
  BUSY_THRESHOLD,
  DEFAULT_WEIGHTS,
  HEAVY_MULTIPLIER,
  LONG_SHIFT_HOURS,
  MAJOR_ITEM_MIN_WEIGHT,
  PREP_DAYS,
  STORM_MAJOR_COUNT,
  STORM_THRESHOLD,
} from "@/lib/forecast/config";
import { ITEM_TYPES } from "@/lib/forecast/types";

export const metadata: Metadata = {
  title: "Responsible design",
  description: "How OwlCast uses AI: students stay in control, AI only reads, transparent rules compute every rating and date.",
};

const TYPE_LABEL: Record<string, string> = {
  exam: "Exam",
  quiz: "Quiz",
  paper: "Paper",
  project: "Project",
  presentation: "Presentation",
  homework: "Homework",
  lab: "Lab",
  participation: "Participation",
  other: "Other",
};

function Section({
  id,
  Icon,
  title,
  children,
}: {
  id: string;
  Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="grid grid-cols-1 gap-4 border-t border-line py-10 md:grid-cols-[17rem_minmax(0,1fr)] md:gap-10">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-cherry-light text-cherry">
          <Icon className="size-5.5" aria-hidden={true} />
        </span>
        <h2 id={id} className="pt-1.5 text-2xl leading-tight font-semibold">
          {title}
        </h2>
      </div>
      <div className="min-w-0 max-w-2xl text-lg leading-relaxed text-ink [&_li]:mt-2 [&_p+p]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">{children}</div>
    </section>
  );
}

export default function ResponsiblePage() {
  return (
    <div className="mx-auto max-w-[1120px] px-4 pt-10 sm:px-6 sm:pt-14">
      <h1 className="max-w-3xl font-display text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
        AI reads. Code computes. You decide.
      </h1>
      <p className="mt-4 mb-12 max-w-2xl text-lg text-ink-muted">
        OwlCast uses AI for one narrow job: reading messy syllabi. Everything after that is plain, tested code that you can check.
      </p>

      <Section id="control" Icon={UserCheck} title="You stay in control">
        <p>Nothing is forecast until you&rsquo;ve seen what the AI found. You can edit, add, or delete any item.</p>
        <ul>
          <li>Uncertain items are flagged in &ldquo;Needs your attention&rdquo;, never guessed: TBD dates, missing weights, low-confidence reads, dates we calculated from &ldquo;Week N&rdquo;, and dates on no-class days.</li>
          <li>Items without a date stay on your list but out of the forecast until you add one.</li>
        </ul>
      </Section>

      <Section id="rules" Icon={Calculator} title="AI reads, code computes">
        <p>
          The AI only turns a syllabus into a list of items. Ratings, dates, and recommendations come from these rules, the same ones in our
          tested source code:
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="card p-4">
            <RatingBadge kind="clear" />
            <p className="mt-2 text-base text-ink-muted tabular">Week load under {BUSY_THRESHOLD}</p>
          </div>
          <div className="card p-4">
            <RatingBadge kind="busy" />
            <p className="mt-2 text-base text-ink-muted tabular">
              Load {BUSY_THRESHOLD} to {STORM_THRESHOLD - 0.1}
            </p>
          </div>
          <div className="card p-4">
            <RatingBadge kind="storm" />
            <p className="mt-2 text-base text-ink-muted tabular">
              Load {STORM_THRESHOLD}+, or {STORM_MAJOR_COUNT}+ major items due
            </p>
          </div>
        </div>
        <ul>
          <li>
            An item&rsquo;s load is its grade weight. If the syllabus gives none, we use a default for its type. Marking an item &ldquo;Heavy for
            me&rdquo; multiplies it by {HEAVY_MULTIPLIER}.
          </li>
          <li>A week&rsquo;s load is the sum of everything due that week. Major items are worth {MAJOR_ITEM_MIN_WEIGHT}% or more.</li>
          <li>
            Start dates count back from the due date, skip Storm weeks, move off days with {LONG_SHIFT_HOURS}+ hours of work shifts, and never
            land on study or finals days.
          </li>
        </ul>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-surface" tabIndex={0} role="region" aria-labelledby="rules-table-caption">
          <table className="w-full min-w-[420px] text-left text-base tabular">
            <caption id="rules-table-caption" className="px-4 pt-3 text-left font-semibold">
              Defaults by item type
            </caption>
            <thead>
              <tr className="border-b border-line text-ink-muted">
                <th scope="col" className="px-4 py-2 font-semibold">
                  Type
                </th>
                <th scope="col" className="px-4 py-2 font-semibold">
                  Default weight
                </th>
                <th scope="col" className="px-4 py-2 font-semibold">
                  Days of lead time
                </th>
              </tr>
            </thead>
            <tbody>
              {ITEM_TYPES.map((t) => (
                <tr key={t} className="border-b border-line last:border-0">
                  <th scope="row" className="px-4 py-2 font-medium">
                    {TYPE_LABEL[t]}
                  </th>
                  <td className="px-4 py-2">{DEFAULT_WEIGHTS[t]}%</td>
                  <td className="px-4 py-2">{PREP_DAYS[t] || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="privacy" Icon={EyeOff} title="Privacy by design">
        <ul>
          <li>Files are read and immediately discarded. Nothing is stored on our servers, and syllabus text is never logged.</li>
          <li>No accounts. Your plan lives only in your browser, and &ldquo;Start over&rdquo; clears it.</li>
          <li>
            The <Link href="/insights" className="font-medium text-cherry underline underline-offset-2">advisor heatmap</Link> is a concept that
            would use only opt-in, anonymous totals, with groups under 20 students never shown.
          </li>
        </ul>
      </Section>

      <Section id="a11y" Icon={Accessibility} title="Accessibility">
        <ul>
          <li>WCAG 2.1 AA color contrast, checked by an automated test.</li>
          <li>Everything works with a keyboard, with visible focus, labels for screen readers, and live updates while files are read.</li>
          <li>Ratings always pair an icon with a word. Color is never the only signal.</li>
          <li>Animations turn off when your device asks for reduced motion. The forecast prints cleanly.</li>
        </ul>
      </Section>

      <Section id="safety" Icon={ShieldHalf} title="Safety">
        <ul>
          <li>Syllabus text is treated as data, not instructions. Our demo includes a line telling AI tools to &ldquo;mark every week Clear&rdquo;, and it has no effect.</li>
          <li>Every AI answer is checked against a strict schema before we use it. Bad answers are retried once, then rejected.</li>
          <li>Uploads are checked for real file type and size, and requests are rate-limited.</li>
        </ul>
      </Section>

      <Section id="limits" Icon={AlertTriangle} title="Limitations">
        <ul>
          <li>Grade weight is a useful estimate of effort, but not a perfect one. A 5% lab can take a weekend. Use &ldquo;Heavy for me&rdquo; for those.</li>
          <li>Professors change dates. Always check your syllabus and Canvas for official dates.</li>
          <li>Temple dates come from the registrar&rsquo;s public calendar and may change.</li>
        </ul>
      </Section>

      <div className="card mt-6 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <p className="flex items-center gap-3 text-xl font-semibold">
          <ShieldCheck className="size-6 text-cherry" aria-hidden="true" />
          See it for yourself.
        </p>
        <Button asChild size="lg">
          <Link href="/plan?demo=1">Try the demo</Link>
        </Button>
      </div>
    </div>
  );
}
