"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/plan", label: "Forecast" },
  { href: "/insights", label: "Insights" },
  { href: "/responsible", label: "Responsible AI" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header
      data-site-header
      className="sticky top-0 z-40 border-b border-line/80 bg-canvas/90 backdrop-blur-md supports-[backdrop-filter]:bg-canvas/75"
    >
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2.5 sm:px-6">
        <Link href="/" className="-ml-1 rounded-lg p-1" aria-label="OwlCast home">
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="-mr-2 sm:mr-0">
          <ul className="flex items-center gap-0.5 sm:gap-1">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-11 items-center rounded-lg px-2.5 text-[15px] font-medium text-ink-muted transition-colors hover:text-ink sm:px-3.5 sm:text-base",
                      active && "text-cherry hover:text-cherry",
                    )}
                  >
                    <span className={cn("border-b-2 border-transparent py-0.5", active && "border-cherry")}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
