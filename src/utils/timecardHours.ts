/**
 * Hour totals for a timecard.
 *
 * Read off the entries the employee actually typed in rather than the
 * aggregate columns on the timecard row. Overhead is the sum of the
 * non-billable entries — not `totalHours - billableHours`, which goes negative
 * whenever the stored total disagrees with the entries, and which is why the
 * payroll table showed rows like "-37.0h overhead / 331% utilization".
 *
 * The aggregate columns are still the fallback for callers that load a timecard
 * without its entries.
 */

const sumHours = (rows: any[]): number =>
    rows.reduce((total, row) => total + Number(row?.totalHours || 0), 0);

export interface TimecardHours {
    /** Hours booked to a project phase. */
    billable: number;
    /** Non-billable hours — Bereavement, Client Billing & Invoice Review, etc. */
    overhead: number;
    /** Billable + overhead. */
    total: number;
    /** Share of logged time that was billable. Never exceeds 100%. */
    utilization: number;
}

export function timecardHours(timecard: any): TimecardHours {
    const billable = Array.isArray(timecard?.billableEntries)
        ? sumHours(timecard.billableEntries)
        : Number(timecard?.billableHours || 0);

    const overhead = Array.isArray(timecard?.entries)
        ? sumHours(timecard.entries)
        : Number(timecard?.nonBillableHours || 0);

    const total = billable + overhead;

    return {
        billable,
        overhead,
        total,
        utilization: total > 0 ? (billable / total) * 100 : 0,
    };
}
