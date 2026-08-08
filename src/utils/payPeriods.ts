/**
 * Bi-weekly pay period calendar.
 *
 * Periods run in unbroken 14-day blocks anchored to the firm's payroll start
 * date (the PAYROLL_START_DATE site setting, seeded from the SUPER_ADMIN
 * account's creation date). Numbering restarts at 1 each calendar year, so a
 * period number is only meaningful together with its year - which matches how
 * timecards store `payPeriod` + `payYear`.
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const PERIOD_LENGTH_DAYS = 14;

export interface PayPeriod {
  period: number;
  startDate: Date;
  endDate: Date;
  label: string;
}

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * Fallback anchor for when the payroll start date hasn't loaded yet: the first
 * Monday of the year, which is what the app used before the setting existed.
 */
export function defaultAnchorForYear(year: number) {
  const jan1 = new Date(year, 0, 1);
  const dayOfWeek = jan1.getDay();
  const daysToFirstMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
  return new Date(year, 0, 1 + daysToFirstMonday);
}

/**
 * Every pay period that starts within `year`, walking 14-day blocks from
 * `anchor`. In the anchor's own year, period 1 is the anchor date itself.
 */
export function generatePayPeriods(year: number, anchor?: Date | string | null): PayPeriod[] {
  const anchorDate = anchor ? startOfDay(new Date(anchor)) : defaultAnchorForYear(year);
  if (Number.isNaN(anchorDate.getTime())) {
    return generatePayPeriods(year, defaultAnchorForYear(year));
  }

  const yearStart = new Date(year, 0, 1);

  let first = anchorDate;
  if (anchorDate.getFullYear() !== year) {
    // Step in whole periods to the first block starting on/after Jan 1.
    // Math.ceil also walks backwards correctly for years before the anchor.
    const dayGap = (yearStart.getTime() - anchorDate.getTime()) / MS_PER_DAY;
    const steps = Math.ceil(dayGap / PERIOD_LENGTH_DAYS);
    first = addDays(anchorDate, steps * PERIOD_LENGTH_DAYS);
  }

  const periods: PayPeriod[] = [];
  let cursor = first;
  // A calendar year holds 26 full periods, occasionally 27.
  while (cursor.getFullYear() === year && periods.length < 27) {
    const endDate = addDays(cursor, PERIOD_LENGTH_DAYS - 1);
    periods.push({
      period: periods.length + 1,
      startDate: cursor,
      endDate,
      label: `Period ${periods.length + 1} (${cursor.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`,
    });
    cursor = addDays(cursor, PERIOD_LENGTH_DAYS);
  }

  return periods;
}

/** Index of the period containing today, or the most recent one that started. */
export function getCurrentPayPeriodIndex(periods: { startDate: Date }[]) {
  const today = new Date();
  for (let i = periods.length - 1; i >= 0; i--) {
    if (today >= periods[i].startDate) return i;
  }
  return 0;
}
