/**
 * Project progress percentage formula:
 * - PENDING / REVIEWED (Inquiry) -> 0%
 * - SCHEDULED (Bidding)          -> 15%
 * - ACTIVE                       -> 15% + share of remaining 84% per completed
 *                                   phase, rounded to a whole number
 * - COMPLETED                    -> 100%
 * - CANCELLED                    -> 0% (not specified by product, defaulting to 0)
 *
 * Completing the final phase means the project is finished, so it reports 100%
 * without waiting for someone to flip the status by hand. With four phases
 * that gives 36%, 57%, 78%, then 100%.
 */
export function getProjectProgress(
  status: string,
  completedPhaseCount: number,
  totalPhaseCount: number
): number {
  if (status === "COMPLETED") return 100;

  // Every phase done = project done, whatever the stored status says.
  if (totalPhaseCount > 0 && completedPhaseCount >= totalPhaseCount) return 100;

  switch (status) {
    case "PENDING":
    case "REVIEWED":
      return 0;
    case "SCHEDULED":
      return 15;
    case "ACTIVE":
      if (totalPhaseCount <= 0) return 15;
      return 15 + Math.round((completedPhaseCount / totalPhaseCount) * 84);
    default:
      return 0;
  }
}
