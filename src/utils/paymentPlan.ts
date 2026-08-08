/**
 * The platform bills a proposal exactly one of two ways. Everything client- and
 * PM-facing should read these labels from here so the wording never drifts.
 *
 *  - PHASE_COMPLETION: an installment per phase, priced from that phase's service
 *  - LUMP_SUM:         the whole amount, once
 *
 * The backend persists these as the Prisma `PaymentType` enum (INSTALLMENT /
 * LUMP_SUM) and, on older rows, as a free-text `paymentMethod`. `isLumpSum`
 * accepts every shape we have written over time.
 */
export type PaymentPlan = "PHASE_COMPLETION" | "LUMP_SUM";

export const PAYMENT_PLAN_OPTIONS: { value: PaymentPlan; label: string }[] = [
    { value: "PHASE_COMPLETION", label: "Pay by phase completion" },
    { value: "LUMP_SUM", label: "Lump sum" },
];

/** True when the given proposal/payment-status shape bills all at once. */
export function isLumpSum(source: {
    paymentMethod?: string | null;
    paymentType?: string | null;
} | null | undefined): boolean {
    if (!source) return false;
    const method = (source.paymentMethod || "").toUpperCase();
    const type = (source.paymentType || "").toUpperCase();
    return (
        method === "LUMPSUM" ||
        method === "LUMP_SUM" ||
        type === "LUMP_SUM"
    );
}

export function paymentPlanLabel(source: {
    paymentMethod?: string | null;
    paymentType?: string | null;
} | null | undefined): string {
    return isLumpSum(source) ? "Lump sum" : "Pay by phase completion";
}

export function paymentPlanDescription(
    source: { paymentMethod?: string | null; paymentType?: string | null } | null | undefined
): string {
    return isLumpSum(source)
        ? "One-time full project payment required"
        : "An installment falls due as each phase is completed";
}
