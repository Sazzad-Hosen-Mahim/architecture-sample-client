/**
 * Money and percentage formatting for the financial screens.
 *
 * Every dollar figure carries cents and thousands separators ($32,500.00,
 * $1,250,000.00) and every percentage carries two decimals, so nothing on the
 * dashboard reads as a rounded-off approximation of a real ledger amount.
 */

const asFinite = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/** `$32,500.00` — always two decimals, always grouped. */
export const formatCurrency = (value: unknown) =>
  `$${asFinite(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/**
 * `-$805,903.00` for a negative, rather than `$-805,903.00`. Used where a
 * figure is shown as a deduction.
 */
export const formatSignedCurrency = (value: unknown) => {
  const n = asFinite(value);
  return n < 0 ? `-${formatCurrency(Math.abs(n))}` : formatCurrency(n);
};

/** `94.80%` — a ratio already expressed in percent (94.8 → "94.80%"). */
export const formatPercent = (value: unknown) => `${asFinite(value).toFixed(2)}%`;

/** `210.00 hrs` */
export const formatHours = (value: unknown) =>
  `${asFinite(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} hrs`;

/** `$31.25/hr` */
export const formatRate = (value: unknown) => `${formatCurrency(value)}/hr`;

/** `1,234` — a plain count, grouped but without decimals. */
export const formatCount = (value: unknown) =>
  asFinite(value).toLocaleString("en-US", { maximumFractionDigits: 0 });
