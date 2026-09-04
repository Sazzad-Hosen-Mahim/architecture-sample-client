/**
 * Splitting a contract across the calendar years a project runs through.
 *
 * A contract is earned over the days the project is actually running, so one
 * that rolls into the next year belongs partly to each. The split is by day
 * count: a project running 12 Nov 2026 → 23 Jan 2028 is 50/365/23 days, and a
 * $32,500 contract lands as $3,711 / $27,097 / $1,707 across those three years.
 *
 * This mirrors the same split on the server, which is what the Financial
 * Dashboard's yearly totals are built from.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/** Days from `from` to `to` counting both ends — same day is 1 day, not 0. */
const inclusiveDays = (fromMs: number, toMs: number) =>
  Math.round((toMs - fromMs) / MS_PER_DAY) + 1;

export interface ContractYearSlice {
  year: number;
  days: number;
  /** This year's days as a fraction of the project's whole run. */
  share: number;
}

export interface ProjectRun {
  slices: ContractYearSlice[];
  totalDays: number;
  start: Date | null;
  end: Date | null;
  /** True while the project is still running, i.e. it has no end date yet. */
  ongoing: boolean;
}

/**
 * The project's run, split into one row per calendar year it touches.
 *
 * A project that has not started yet has no run at all. One that has started
 * but not finished accrues up to today, so its split keeps moving until the
 * final phase closes.
 */
export const projectRun = (
  startedAt?: string | Date | null,
  completedAt?: string | Date | null,
): ProjectRun => {
  const empty: ProjectRun = {
    slices: [],
    totalDays: 0,
    start: null,
    end: null,
    ongoing: false,
  };
  if (!startedAt) return empty;

  const start = new Date(startedAt);
  if (Number.isNaN(start.getTime())) return empty;

  const completed = completedAt ? new Date(completedAt) : null;
  const ongoing = !completed || Number.isNaN(completed.getTime());
  const end = ongoing ? new Date() : (completed as Date);

  const startMs = startOfDay(start);
  const endMs = Math.max(startMs, startOfDay(end));
  const totalDays = inclusiveDays(startMs, endMs);

  const slices: ContractYearSlice[] = [];
  for (
    let year = new Date(startMs).getFullYear();
    year <= new Date(endMs).getFullYear();
    year++
  ) {
    const yearStartMs = Math.max(startMs, startOfDay(new Date(year, 0, 1)));
    const yearEndMs = Math.min(endMs, startOfDay(new Date(year, 11, 31)));
    if (yearEndMs < yearStartMs) continue;
    const days = inclusiveDays(yearStartMs, yearEndMs);
    slices.push({ year, days, share: totalDays > 0 ? days / totalDays : 0 });
  }

  return { slices, totalDays, start, end, ongoing };
};

/** "50/365/23" — the per-year day counts, in order. */
export const runDaysLabel = (run: ProjectRun) =>
  run.slices.length === 0 ? "—" : run.slices.map((s) => s.days).join("/");

/**
 * The fraction of a contract belonging to one year. A project with no run yet
 * is treated as wholly in the year it would be read in, so a contract signed
 * before the timer starts still shows up somewhere.
 */
export const shareOfYear = (run: ProjectRun, year: number) => {
  if (run.slices.length === 0) return 0;
  return run.slices.find((s) => s.year === year)?.share ?? 0;
};
