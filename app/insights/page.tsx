import type { Metadata } from "next";
import { EyeOff, GraduationCap, Info, Lock, Palmtree, UserCheck, Users } from "lucide-react";
import data from "@/data/insights-demo.json";
import { cherryScale } from "@/lib/color";

export const metadata: Metadata = {
  title: "Insights",
  description: "A vision for advisors: an opt-in, anonymous heatmap of when Storm weeks hit different student groups.",
};

const PILOT = [
  { Icon: UserCheck, title: "Opt-in only", body: "Students choose to share. Nothing is collected by default." },
  { Icon: EyeOff, title: "Anonymous and aggregated", body: "Only counts of Storm weeks per group. No names, courses, or grades." },
  { Icon: Users, title: "Groups under 20 are never shown", body: "Small groups are hidden so no one can be singled out." },
  { Icon: Lock, title: "No individual data for anyone", body: "Advisors see patterns, not people. Students keep their own forecast." },
];

export default function InsightsPage() {
  const weeks = Array.from({ length: data.weeks }, (_, i) => i + 1);
  const max = Math.max(...data.groups.flatMap((g) => g.values.filter((v): v is number => v !== null)));

  return (
    <div className="mx-auto max-w-[1120px] px-4 pt-10 sm:px-6 sm:pt-14">
      <p className="flex items-start gap-2.5 rounded-2xl border-2 border-cherry bg-cherry-light px-5 py-3.5 font-semibold text-cherry-dark">
        <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        Illustrative demo data. No real student data is used.
      </p>

      <h1 className="mt-10 max-w-3xl font-display text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
        What if advisors could see the storm coming?
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-muted">
        If students opted in, OwlCast could show advisors when whole groups of students hit a Storm week at the same time, early enough to
        reach out, move a deadline, or open more tutoring hours.
      </p>

      <section aria-labelledby="heatmap-h" className="card mt-10 p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="heatmap-h" className="text-xl font-semibold sm:text-2xl">
              Share of students with a Storm week, Spring 2027
            </h2>
            <p className="mt-1 text-ink-muted">Each cell is the percent of a group whose forecast rates that week Storm.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-ink-muted" aria-hidden="true">
            <span>0%</span>
            <span className="h-3 w-32 rounded-full" style={{ background: `linear-gradient(90deg, ${cherryScale(0, max).bg}, ${cherryScale(max / 2, max).bg}, ${cherryScale(max, max).bg})` }} />
            <span>{max}%</span>
          </div>
        </div>

        <div className="relative mt-6 overflow-x-auto" tabIndex={0} role="region" aria-labelledby="heatmap-h">
          <table className="w-full min-w-[860px] border-separate border-spacing-1 text-center tabular">
            <caption className="sr-only">
              Percent of students in each example group with a Storm week, by week of Spring 2027. Week 8 is Spring Break; weeks 16 and 17 are
              finals. Illustrative data.
            </caption>
            <thead>
              <tr>
                <th scope="col" className="w-48 px-2 pb-2 text-left text-sm font-semibold text-ink-muted">
                  Group
                </th>
                {weeks.map((w) => {
                  const isBreak = data.breakWeeks.includes(w);
                  const isFinals = data.finalsWeeks.includes(w);
                  return (
                    <th key={w} scope="col" className="pb-2 text-sm font-semibold">
                      <span className={w === 7 ? "text-cherry" : "text-ink"}>
                        <span className="sr-only">Week </span>
                        {w}
                      </span>
                      {isBreak && <Palmtree className="mx-auto mt-0.5 size-3.5 text-break-fg" aria-label="Spring Break" />}
                      {isFinals && <GraduationCap className="mx-auto mt-0.5 size-3.5 text-cherry-dark" aria-label="Finals" />}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {data.groups.map((g) => (
                <tr key={g.name}>
                  <th scope="row" className="px-2 text-left text-[15px] leading-tight font-semibold">
                    {g.name}
                    <span className="block text-sm font-normal text-ink-muted">{g.size} students</span>
                  </th>
                  {g.values.map((v, i) => {
                    if (v === null)
                      return (
                        <td key={i} className="h-12 rounded-md bg-break-bg text-sm font-medium text-break-fg">
                          <span aria-hidden="true">–</span>
                          <span className="sr-only">Spring Break</span>
                        </td>
                      );
                    const { bg, fg } = cherryScale(v, max);
                    return (
                      <td key={i} className="h-12 min-w-11 rounded-md text-[15px] font-semibold" style={{ backgroundColor: bg, color: fg }}>
                        {v}
                        <span className="sr-only">%</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <Palmtree className="size-4 text-break-fg" aria-hidden="true" /> Week 8: Spring Break
          </span>
          <span className="inline-flex items-center gap-1.5">
            <GraduationCap className="size-4 text-cherry-dark" aria-hidden="true" /> Weeks 16–17: Finals
          </span>
          <span>Week 7 (Feb 22–28) is the week before Spring Break, when midterms pile up.</span>
        </p>
      </section>

      <section aria-labelledby="pilot-h" className="mt-16">
        <h2 id="pilot-h" className="font-display text-3xl font-semibold tracking-tight">
          How a pilot would protect students
        </h2>
        <p className="mt-2 max-w-2xl text-lg text-ink-muted">
          This page is a concept. Nothing here is built on real data, and OwlCast stores nothing today.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {PILOT.map(({ Icon, title, body }) => (
            <li key={title} className="card flex gap-4 p-5 sm:p-6">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-cherry-light text-cherry">
                <Icon className="size-5.5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-lg font-semibold">{title}</span>
                <span className="mt-1 block text-ink-muted">{body}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
