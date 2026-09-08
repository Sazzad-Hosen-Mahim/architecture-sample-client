/**
 * Display formatting for a project's size and addresses.
 *
 * Both are stored as free text captured from a form, so nothing here assumes a
 * shape — every part is optional and simply drops out when it is absent.
 */

/**
 * Group the number in a project size: `"2000 sq ft"` -> `"2,000 sq ft"`.
 *
 * Sizes are stored as text and the two intake paths disagree — the New Project
 * wizard writes a grouped value, older records hold a bare one — so the digits
 * are regrouped from scratch and any unit is carried through untouched. Running
 * it on an already-grouped value returns it unchanged.
 */
export const formatProjectSize = (value?: string | null): string => {
  if (!value) return "";
  return String(value).replace(/\d[\d,]*/g, (run) =>
    Number(run.replace(/,/g, "")).toLocaleString("en-US"),
  );
};

/**
 * Put a budget figure in dollars: `"850000"` -> `"$850,000"`.
 *
 * The stored values are a mixture, because the field has been captured several
 * different ways over time — bare numbers (`"850000"`), already-formatted
 * amounts (`"$800,000 USD"`), and picker labels (`"$250k-$500k"`,
 * `"Under $100k"`, `"over-1m"`). Only a value that is *purely* a number is
 * touched; anything already carrying a `$` or any letters is left exactly as
 * it is, so a formatted amount is never doubled up and a range label is never
 * mangled into `"$100k-250k"`.
 */
export const formatBudgetRange = (value?: string | null): string => {
  if (!value) return "";
  const raw = String(value).trim();

  // Digits with optional grouping and decimals, and nothing else.
  if (!/^\d[\d,]*(\.\d+)?$/.test(raw)) return raw;

  const n = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(n)) return raw;

  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
};

export interface AddressParts {
  street?: string | null;
  aptSuite?: string | null;
  city?: string | null;
  country?: string | null;
  zip?: string | null;
}

/**
 * An address as the two lines it is read in:
 *
 *   Street Address / Apt-Suite
 *   City, Country, Zip
 *
 * Returned as separate strings rather than one joined value so the caller can
 * put a real line break between them — running the whole thing together on one
 * line is what made these hard to scan.
 */
export const formatAddressLines = (
  parts: AddressParts,
): { line1: string; line2: string; isEmpty: boolean } => {
  const line1 = [parts.street, parts.aptSuite].filter(Boolean).join(" / ");
  const line2 = [parts.city, parts.country, parts.zip].filter(Boolean).join(", ");
  return { line1, line2, isEmpty: !line1 && !line2 };
};
