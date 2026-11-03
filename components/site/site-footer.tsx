import Link from "next/link";
import { OwlMark } from "@/components/brand/logo";

export function SiteFooter() {
  return (
    <footer data-site-footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <OwlMark className="mt-0.5 size-7" />
          <p className="max-w-md text-[15px] leading-relaxed text-ink-muted">
            Built for the Temple AI Build Challenge. Not an official Temple University product.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[15px]">
            <li>
              <Link className="inline-flex min-h-11 items-center text-ink-muted hover:text-ink" href="/plan">
                Build a forecast
              </Link>
            </li>
            <li>
              <Link className="inline-flex min-h-11 items-center text-ink-muted hover:text-ink" href="/insights">
                Insights
              </Link>
            </li>
            <li>
              <Link className="inline-flex min-h-11 items-center text-ink-muted hover:text-ink" href="/responsible">
                Responsible design
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
