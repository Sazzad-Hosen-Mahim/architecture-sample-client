/**
 * Payroll tax math, shared by the timecard review dialog and the payroll table
 * so both always show the same gross / tax / net figures.
 *
 * Tax lines come from the employee's profile (EmployeeTax rows: taxType,
 * optional customName for "OTHERS", and a percentage). Each line is applied to
 * gross pay, and net is what the employee is actually owed:
 *
 *   gross $100 with a single 10% line  ->  $10 tax, $90 net
 */

export interface EmployeeTaxLine {
  id?: string;
  taxType: string;
  customName?: string | null;
  percentage: number | string;
}

export interface ResolvedTaxLine {
  id: string;
  label: string;
  percentage: number;
  amount: number;
}

export interface PayrollBreakdown {
  gross: number;
  lines: ResolvedTaxLine[];
  totalTaxPercentage: number;
  totalTax: number;
  net: number;
}

export const taxLineLabel = (tax: EmployeeTaxLine) =>
  tax.taxType === "OTHERS" ? tax.customName?.trim() || "Other" : tax.taxType;

/**
 * @param gross              Gross pay for the period (hours x hourly rate).
 * @param taxes              The employee's configured tax lines.
 * @param fallbackPercentage Legacy single `taxPercentage` on the profile, used
 *                           only when no itemised lines exist.
 */
export function computePayrollBreakdown(
  gross: number,
  taxes: EmployeeTaxLine[] | undefined | null,
  fallbackPercentage?: number | string | null
): PayrollBreakdown {
  const safeGross = Number.isFinite(gross) ? gross : 0;

  let lines: ResolvedTaxLine[] = (taxes || [])
    .map((tax, i) => {
      const percentage = Number(tax.percentage) || 0;
      return {
        id: tax.id || `${tax.taxType}-${i}`,
        label: taxLineLabel(tax),
        percentage,
        amount: (safeGross * percentage) / 100,
      };
    })
    .filter((line) => line.percentage !== 0);

  if (lines.length === 0) {
    const fallback = Number(fallbackPercentage) || 0;
    if (fallback > 0) {
      lines = [
        {
          id: "fallback",
          label: "Withholding",
          percentage: fallback,
          amount: (safeGross * fallback) / 100,
        },
      ];
    }
  }

  const totalTaxPercentage = lines.reduce((sum, l) => sum + l.percentage, 0);
  const totalTax = lines.reduce((sum, l) => sum + l.amount, 0);

  return {
    gross: safeGross,
    lines,
    totalTaxPercentage,
    totalTax,
    net: safeGross - totalTax,
  };
}

/** Gross pay for a timecard = total hours logged x the employee's hourly rate. */
export function timecardGross(timecard: any): number {
  const hourlyRate = Number(timecard?.user?.employeeProfile?.hourlyRate || 0);
  return Number(timecard?.totalHours || 0) * hourlyRate;
}

/** Convenience: full gross/tax/net breakdown straight from a timecard record. */
export function timecardBreakdown(timecard: any): PayrollBreakdown {
  const profile = timecard?.user?.employeeProfile;
  return computePayrollBreakdown(
    timecardGross(timecard),
    profile?.taxes,
    profile?.taxPercentage
  );
}

export const formatCurrency = (value: number) =>
  `$${(Number.isFinite(value) ? value : 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
