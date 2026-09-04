import { CalendarRange } from "lucide-react";

export type FinancialScope = "all" | "year";

interface ScopeSelectProps {
  scope: FinancialScope;
  year: number;
  onChange: (scope: FinancialScope, year: number) => void;
  /**
   * The year the firm's account was created. The filter offers that year
   * through the current one and nothing earlier — there are no financials from
   * before the firm existed — and picks up each new year on its own as the
   * account stays open. Falls back to the current year until the dashboard has
   * loaded and can say.
   */
  startYear?: number;
}

const ALL_TIME_VALUE = "all";

/**
 * Toggles the financial dashboard between the firm's running all-time totals
 * and a single year. Defaults to the current year; "All Years" rolls every
 * project ever — archived included — into one calculator.
 */
export default function ScopeSelect({
  scope,
  year,
  onChange,
  startYear,
}: ScopeSelectProps) {
  const currentYear = new Date().getFullYear();
  const firstYear = Math.min(startYear || currentYear, currentYear);
  const years = Array.from(
    { length: currentYear - firstYear + 1 },
    (_, i) => currentYear - i,
  );

  const value = scope === "all" ? ALL_TIME_VALUE : String(year);

  return (
    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl">
      <CalendarRange size={14} className="text-gray-400" />
      <select
        className="text-sm bg-transparent outline-none font-bold text-gray-700 cursor-pointer"
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          if (next === ALL_TIME_VALUE) {
            onChange("all", year);
          } else {
            onChange("year", Number(next));
          }
        }}
      >
        <option value={ALL_TIME_VALUE}>All Years (All Time)</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
            {y === currentYear ? " (Current Year)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
