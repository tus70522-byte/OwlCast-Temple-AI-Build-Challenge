import {
  BUSY_THRESHOLD,
  DEFAULT_WEIGHTS,
  HEAVY_MULTIPLIER,
  MAJOR_ITEM_MIN_WEIGHT,
  STORM_MAJOR_COUNT,
  STORM_THRESHOLD,
} from "./config";
import type { EngineItem, Rating, SemesterWeek, WeekForecast } from "./types";

/** The item's grade weight, or the default for its type when unknown. */
export function effectiveWeight(item: Pick<EngineItem, "weightPercent" | "type">): number {
  return item.weightPercent ?? DEFAULT_WEIGHTS[item.type];
}

/** (weight ?? DEFAULT_WEIGHTS[type]) × (heavy ? HEAVY_MULTIPLIER : 1) */
export function itemLoad(item: Pick<EngineItem, "weightPercent" | "type" | "heavy">): number {
  return effectiveWeight(item) * (item.heavy ? HEAVY_MULTIPLIER : 1);
}

export function isMajorItem(item: Pick<EngineItem, "weightPercent" | "type">): boolean {
  return effectiveWeight(item) >= MAJOR_ITEM_MIN_WEIGHT;
}

export function rateWeek(load: number, majorCount: number, isBreak: boolean): Rating {
  if (isBreak) return "break";
  if (load >= STORM_THRESHOLD || majorCount >= STORM_MAJOR_COUNT) return "storm";
  if (load >= BUSY_THRESHOLD) return "busy";
  return "clear";
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function buildForecast(items: EngineItem[], weeks: SemesterWeek[]): WeekForecast[] {
  return weeks.map((week) => {
    const due = items
      .filter((i) => i.dueDate && i.dueDate >= week.start && i.dueDate <= week.end)
      .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : a.dueDate! > b.dueDate! ? 1 : effectiveWeight(b) - effectiveWeight(a)));
    const load = round1(due.reduce((sum, i) => sum + itemLoad(i), 0));
    const majorCount = due.filter(isMajorItem).length;
    return {
      week,
      items: due,
      load,
      majorCount,
      rating: rateWeek(load, majorCount, week.isBreak),
      hasFinals: week.hasFinals,
    };
  });
}

export interface ForecastSummary {
  stormWeeks: WeekForecast[];
  heaviest: WeekForecast | null;
  totalItems: number;
  datedItems: number;
}

export function summarizeForecast(forecast: WeekForecast[], allItems: EngineItem[]): ForecastSummary {
  const stormWeeks = forecast.filter((w) => w.rating === "storm");
  const heaviest = forecast.reduce<WeekForecast | null>(
    (best, w) => (w.load > 0 && (!best || w.load > best.load) ? w : best),
    null,
  );
  return {
    stormWeeks,
    heaviest,
    totalItems: allItems.length,
    datedItems: forecast.reduce((n, w) => n + w.items.length, 0),
  };
}
