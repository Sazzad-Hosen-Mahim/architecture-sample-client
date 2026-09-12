import { useMemo } from "react";
import { ProposalService } from "@/redux/api/adminDashboard/proposalApi";
import {
  useGetAmendmentsQuery,
  //   useGetAllProposalsForProposalQuery,
  Amendment,
} from "@/redux/api/amendmentApi";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatBudgetRange, formatProjectSize } from "@/utils/projectFormat";
import { serviceScopeOrder } from "@/lib/serviceDescriptions";

interface ViewProposalDetailsModalProps {
  proposal: any;
  onClose: () => void;
  /**
   * The project's payment status, as the Payments tab already receives it.
   * Optional: without it the Payment column simply does not render, rather
   * than every phase claiming to be unpaid.
   */
  paymentInfo?: any;
}

const ViewProposalDetailsModal = ({
  proposal,
  onClose,
  paymentInfo,
}: ViewProposalDetailsModalProps) => {
  // Amendment queries
  const { data: amendmentsData, isLoading: isLoadingAmendments } =
    useGetAmendmentsQuery({ proposalId: proposal.id });
  //   const { data: allProposalsData, isLoading: isLoadingAllProposals } =
  //     useGetAllProposalsForProposalQuery(proposal.id);

  const amendmentsRaw = amendmentsData?.data;
  const amendments = Array.isArray(amendmentsRaw) ? amendmentsRaw : [];

  // Backend returns { normalProposal, amendmentProposals, totalProposals }
  //   const amendmentProposals = Array.isArray(
  //     allProposalsData?.data?.amendmentProposals,
  //   )
  //     ? allProposalsData.data.amendmentProposals
  //     : [];

  /**
   * The lines on this contract the client has actually paid for.
   *
   * The two contract kinds report a settled phase differently, because they
   * are billed differently. An amendment bills each service line directly, so
   * its entry already carries a per-service flag. The base contract bills
   * ProjectStages, which are separate records from the services that price
   * them — those are matched back by name, falling back to position, which is
   * the same pairing the backend prices a stage with.
   *
   * Undefined (not an empty set) when there is no payment status to read, so
   * the column can be hidden rather than showing everything as unpaid.
   */
  const paidServiceIds = useMemo<Set<string> | undefined>(() => {
    const services: ProposalService[] = proposal?.services || [];
    if (!paymentInfo || services.length === 0) return undefined;

    const paid = new Set<string>();
    const markAll = () => {
      services.forEach((s) => paid.add(s.id));
      return paid;
    };
    const norm = (v: unknown) =>
      String(v ?? "")
        .trim()
        .toLowerCase();

    if (proposal.proposalType === "AMENDMENT") {
      const entry = (paymentInfo.amendmentPayments || []).find(
        (ap: { proposalId?: string }) => ap.proposalId === proposal.id,
      );
      if (!entry) return undefined;
      if (entry.paid && entry.paymentMethod === "LUMP_SUM") return markAll();
      (entry.services || []).forEach(
        (s: { serviceId: string; paid?: boolean }) => {
          if (s.paid) paid.add(s.serviceId);
        },
      );
      return paid;
    }

    // A lump sum is one payment for the whole contract, so settling it settles
    // every line on it.
    if (paymentInfo.lumpSumPaid) return markAll();

    const stages = paymentInfo.stages || [];
    const paidStageNames = new Set<string>(
      stages
        .filter((s: { paid?: boolean }) => s.paid)
        .map((s: { stageName?: string }) => norm(s.stageName)),
    );
    // Position pairing reads both sides in contract order, not the order the
    // API happened to return them in.
    const ordered = [...services].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );
    ordered.forEach((service, idx) => {
      if (paidStageNames.has(norm(service.name)) || stages[idx]?.paid) {
        paid.add(service.id);
      }
    });
    return paid;
  }, [paymentInfo, proposal]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getApprovalStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> =
      {
        PENDING_APPROVAL: {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          label: "Pending Approval",
        },
        APPROVED: {
          bg: "bg-green-100",
          text: "text-green-800",
          label: "Approved",
        },
        REJECTED: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
      };
    const c = config[status] || {
      bg: "bg-gray-100",
      text: "text-gray-800",
      label: status,
    };
    return (
      // Tighter and smaller on a phone: "Pending Approval" is the widest thing
      // in a services row, and at full size it alone decided the column's
      // width. `inline-block` so the padding still holds when it wraps.
      <span
        className={`inline-block px-1 py-0.5 text-[10px] sm:px-2 sm:py-1 sm:text-xs rounded font-medium ${c.bg} ${c.text}`}
      >
        {c.label}
      </span>
    );
  };

  const getAmendmentStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> =
      {
        PENDING: {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          label: "Pending",
        },
        APPROVED: {
          bg: "bg-green-100",
          text: "text-green-800",
          label: "Approved",
        },
        REJECTED: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
        UNDER_REVIEW: {
          bg: "bg-blue-100",
          text: "text-blue-800",
          label: "Under Review",
        },
        COMPLETED: {
          bg: "bg-teal-100",
          text: "text-teal-800",
          label: "Completed",
        },
      };
    const c = config[status] || {
      bg: "bg-gray-100",
      text: "text-gray-800",
      label: status,
    };
    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${c.bg} ${c.text}`}
      >
        {c.label}
      </span>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const config: Record<string, { bg: string; text: string }> = {
      LOW: { bg: "bg-gray-100", text: "text-gray-700" },
      MEDIUM: { bg: "bg-blue-100", text: "text-blue-700" },
      HIGH: { bg: "bg-orange-100", text: "text-orange-700" },
      URGENT: { bg: "bg-red-100", text: "text-red-700" },
    };
    const c = config[urgency] || { bg: "bg-gray-100", text: "text-gray-700" };
    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${c.bg} ${c.text}`}
      >
        {urgency}
      </span>
    );
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      {/* The width has to be set on the `sm:` variant, not unprefixed.
          DialogContent's own base carries `sm:max-w-lg`, and tailwind-merge
          keeps an unprefixed `max-w-6xl` alongside it as a separate group — so
          the responsive rule won and this dialog has been rendering at 512px,
          which is what forced the long scroll. Matching the variant lets the
          merge replace it properly. Mobile keeps the base's calc(100% - 2rem).

          scrollbar-hide keeps the wheel/touch scrolling but drops the visible
          track, which is what was cutting into the right edge of the panel. */}
      {/* overflow-x-hidden so the panel itself can never scroll sideways — the
          services table keeps its own overflow-x-auto, so it still scrolls
          within the dialog rather than dragging the dialog with it. */}
      {/* `[&>*]:min-w-0` because DialogContent is a grid: a grid item's default
          minimum size is its own content, so one stubborn child — a wide table,
          an unbroken address — can size the whole column and push the panel
          past its max-width. Letting the children shrink leaves the wrapping,
          and the table's own scroller, to do that job. */}
      <DialogContent className="sm:max-w-6xl xl:max-w-7xl max-h-[95vh] overflow-y-auto overflow-x-hidden scrollbar-hide bg-white p-0 border-none shadow-2xl [&>*]:min-w-0">
        {/* No `items-center`. DialogHeader's base is `flex flex-col`, and
            centring on a column flex stops the child stretching and sizes it to
            its own content instead — so the description was laid out as one
            unwrapped line and ran off the side of the panel on a phone. Left to
            stretch, it fills the header and wraps; the title keeps its own
            `text-center`, so nothing moves on a wide screen. */}
        <DialogHeader className="sticky top-0 bg-white border-b border-gray-300 px-4 sm:px-6 py-4 z-10 shadow-sm">
          <div className="min-w-0 w-full">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-center text-gray-800">
              Proposal Details
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Comprehensive overview of the selected proposal.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Proposal Information */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">
              Proposal Information
            </h3>
            {/* One column on a phone. Two fixed columns left each field about
                half of a 390px screen, so an email or a street address had
                nowhere to go and pushed the whole dialog sideways. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoField
                label="Proposal Number"
                value={proposal.proposalNumber}
              />
              <InfoField
                label="Status"
                value={<ProposalStatusBadge status={proposal.status} />}
              />
              <InfoField label="Title" value={proposal.title} />
              <InfoField
                label="Created At"
                value={formatDate(proposal.createdAt)}
              />
              <InfoField label="Sent At" value={formatDate(proposal.sentAt)} />
              {/* <InfoField
                label="Viewed At"
                value={formatDate(proposal.viewedAt)}
              /> */}
            </div>
          </section>

          {/* Client Information */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">
              Client Information
            </h3>
            {/* One column on a phone. Two fixed columns left each field about
                half of a 390px screen, so an email or a street address had
                nowhere to go and pushed the whole dialog sideways. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoField label="Client Name" value={proposal.clientName} />
              <InfoField
                label="Company"
                value={proposal.clientCompany || "N/A"}
              />
              <InfoField label="Email" value={proposal.clientEmail} />
              <InfoField label="Phone" value={proposal.clientPhone} />
            </div>
          </section>

          {/* Project Information */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">
              Project Information
            </h3>
            {/* One column on a phone. Two fixed columns left each field about
                half of a 390px screen, so an email or a street address had
                nowhere to go and pushed the whole dialog sideways. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoField label="Project Name" value={proposal.projectName} />
              <InfoField label="Location" value={proposal.projectLocation} />
              <InfoField
                label="Service Type"
                value={proposal.serviceType?.replace(/_/g, " ")}
              />
              <InfoField label="Category" value={proposal.projectCategory} />
              <InfoField
                label="Square Footage"
                value={formatProjectSize(proposal.squareFootage)}
              />
              <InfoField
                label="Budget Range"
                value={formatBudgetRange(proposal.budgetRange)}
              />
            </div>
            {proposal.projectDescription && (
              <div className="mt-4">
                <InfoField
                  label="Project Description"
                  value={proposal.projectDescription}
                  fullWidth
                />
              </div>
            )}
            {proposal.additionalContext && (
              <div className="mt-4">
                <InfoField
                  label="Additional Context"
                  value={proposal.additionalContext}
                  fullWidth
                />
              </div>
            )}
          </section>

          {/* Services */}
          {proposal.services && proposal.services.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">
                Services
              </h3>
              {/* `w-full`, not `min-w-full`: the table should settle into the
                  dialog rather than take whatever width its widest row asks
                  for. `overflow-x-auto` stays as a fallback for a phone
                  narrower than the columns can compress to. */}
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-300">
                  <thead className="bg-gray-50">
                    {/* Padding and type step up at `sm`. On a portrait phone the
                        full-size cells could not fit six columns, so the table
                        scrolled sideways and half of it was off-screen. */}
                    <tr className="[&>th]:px-1.5 [&>th]:py-1.5 [&>th]:text-[10px] [&>th]:font-medium [&>th]:text-gray-700 sm:[&>th]:px-4 sm:[&>th]:py-2 sm:[&>th]:text-xs">
                      <th className="text-left">Service</th>
                      <th className="text-center">Rate</th>
                      {/* Quantity is the one column a client never needs: it is
                          1 on every standard phase, and Rate × Quantity is
                          already shown as Amount beside it. */}
                      <th className="hidden sm:table-cell text-center">
                        Quantity
                      </th>
                      <th className="text-center">Amount</th>
                      <th className="text-center">Status</th>
                      {paidServiceIds && (
                        <th className="text-center">Payment</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-300">
                    {/* Sorted into scope order rather than shown as stored:
                        the eight standard phases in contract sequence, then
                        anything added on top of them, each keeping its own
                        position. `order` is the tiebreak, so two custom phases
                        stay in the order the PM gave them. */}
                    {[...proposal.services]
                      .sort(
                        (a: ProposalService, b: ProposalService) =>
                          serviceScopeOrder(a.name) -
                            serviceScopeOrder(b.name) ||
                          (a.order ?? 0) - (b.order ?? 0),
                      )
                      .map((service: ProposalService) => (
                        <tr
                          key={service.id}
                          className="[&>td]:px-1.5 [&>td]:py-1.5 [&>td]:text-[11px] sm:[&>td]:px-4 sm:[&>td]:py-2 sm:[&>td]:text-sm"
                        >
                          <td>
                            <div>
                              {/* `break-words`: a long phase name would otherwise
                                set the column's floor and push the money
                                columns off a narrow screen. */}
                              <div className="font-medium break-words">
                                {service.name}
                              </div>
                              {service.description && (
                                <div className="text-[10px] sm:text-xs text-gray-500 break-words">
                                  {service.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="text-center whitespace-nowrap">
                            ${service.rate}
                          </td>
                          <td className="hidden sm:table-cell text-center">
                            {service.quantity}
                          </td>
                          <td className="text-center font-medium whitespace-nowrap">
                            ${service.amount}
                          </td>
                          <td className="text-center">
                            {getApprovalStatusBadge(service.approvalStatus)}
                            {service.approvalStatus === "REJECTED" &&
                              service.rejectionReason && (
                                <div
                                  className="text-[10px] sm:text-xs text-red-500 mt-1 max-w-[110px] sm:max-w-[200px] break-words"
                                  title={service.rejectionReason}
                                >
                                  {service.rejectionReason}
                                </div>
                              )}
                          </td>
                          {paidServiceIds && (
                            <td className="text-center">
                              {/* Both states are shown: an absent badge would
                                read the same as a phase nobody has billed. */}
                              <span
                                className={`inline-block text-[10px] sm:text-xs font-semibold px-1 py-0.5 sm:px-2 sm:py-1 rounded border whitespace-nowrap ${
                                  paidServiceIds.has(service.id)
                                    ? "bg-green-100 text-green-800 border-green-200"
                                    : "bg-gray-50 text-gray-500 border-gray-200"
                                }`}
                              >
                                {paidServiceIds.has(service.id)
                                  ? "Paid"
                                  : "Unpaid"}
                              </span>
                            </td>
                          )}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Financial Summary */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">
              Financial Summary
            </h3>
            <div className="bg-gray-50 p-4 rounded space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${proposal.subtotal}</span>
              </div>
              {/* No tax line. Nothing charges tax, so showing one here quoted
                  the client a total they would never be billed. Older
                  proposals still carry a stored taxAmount, so it is taken back
                  off rather than trusted — which also leaves credits intact. */}
              <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                <span>Total Amount:</span>
                <span className="text-green-600">
                  $
                  {(
                    Number(proposal.totalAmount || 0) -
                    Number(proposal.taxAmount || 0)
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </section>

          {/* Created By */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">
              Created By
            </h3>
            {/* One column on a phone. Two fixed columns left each field about
                half of a 390px screen, so an email or a street address had
                nowhere to go and pushed the whole dialog sideways. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoField label="Name" value={proposal.createdBy?.name} />
              <InfoField label="Email" value={proposal.createdBy?.email} />
            </div>
          </section>

          {/* ─── Amendments Section ─── */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">
              Amendments
            </h3>
            {isLoadingAmendments ? (
              <div className="text-center text-gray-500 py-4">
                Loading amendments...
              </div>
            ) : amendments.length === 0 ? (
              <div className="text-center text-gray-400 py-4">
                No amendments for this proposal.
              </div>
            ) : (
              <div className="space-y-4">
                {amendments.map((amendment: Amendment) => (
                  <div
                    key={amendment.id}
                    className="border border-gray-300 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {amendment.projectName}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {amendment.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {amendment.urgency &&
                          getUrgencyBadge(amendment.urgency)}
                        {getAmendmentStatusBadge(amendment.status)}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium text-gray-700">
                        Services:
                      </span>{" "}
                      {amendment.services}
                    </div>
                    {amendment.reviewNotes && (
                      <div className="text-sm text-gray-600 mb-2 bg-white p-2 rounded border border-gray-300">
                        <span className="font-medium text-gray-700">
                          Review Notes:
                        </span>{" "}
                        {amendment.reviewNotes}
                      </div>
                    )}
                    {/* Show linked amendment proposal info */}
                    {amendment.amendmentProposal && (
                      <div className="text-sm mb-2 bg-blue-50 p-2 rounded border border-gray-300">
                        <span className="font-medium text-blue-800">
                          Amendment Proposal:
                        </span>{" "}
                        <span className="text-blue-700">
                          {amendment.amendmentProposal.proposalNumber}
                        </span>
                        <span
                          className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                            amendment.amendmentProposal.status === "ACCEPTED"
                              ? "bg-green-100 text-green-800"
                              : amendment.amendmentProposal.status === "SENT"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {amendment.amendmentProposal.status}
                        </span>
                      </div>
                    )}
                    <div className="text-xs text-gray-400">
                      Created: {formatDate(amendment.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ─── Amendment Proposals Section ─── */}
          {/* <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">
              Amendment Proposals
            </h3>
            {isLoadingAllProposals ? (
              <div className="text-center text-gray-500 py-4">
                Loading proposals...
              </div>
            ) : amendmentProposals.length === 0 ? (
              <div className="text-center text-gray-400 py-4">
                No amendment proposals yet.
              </div>
            ) : (
              <div className="space-y-3">
                {amendmentProposals.map((p: any) => (
                  <div
                    key={p.id}
                    className="border border-gray-300 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {p.title || p.projectName}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {p.proposalNumber}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {p.projectDescription || "No description"}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          p.status === "ACCEPTED"
                            ? "bg-green-100 text-green-800"
                            : p.status === "SENT"
                              ? "bg-blue-100 text-blue-800"
                              : p.status === "DRAFT"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-gray-500">Budget:</span>{" "}
                        <span className="font-medium">
                          {formatBudgetRange(p.budgetRange) ||
                            p.totalAmount ||
                            "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Timeline:</span>{" "}
                        <span className="font-medium">
                          {p.expectedTimeline || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Created:</span>{" "}
                        <span className="font-medium">
                          {formatDate(p.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section> */}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-4 sm:px-6 py-4 border-t border-gray-300 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-black text-white rounded hover:bg-gray-900 transition-colors cursor-pointer font-medium"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewProposalDetailsModal;

/* ─── Shared Sub-components ─── */

interface InfoFieldProps {
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
}

const InfoField = ({ label, value, fullWidth = false }: InfoFieldProps) => {
  return (
    // `sm:` on the span because the grid is a single column on a phone, where
    // an unprefixed col-span-2 would conjure a second column and put the field
    // half off-screen. min-w-0 with break-words is what stops a long email or
    // address from setting the column's width and widening the whole dialog —
    // a grid item's default min-width is its content, not zero.
    <div className={`min-w-0 ${fullWidth ? "sm:col-span-2" : ""}`}>
      <dt className="text-xs font-medium text-gray-500 mb-1">{label}</dt>
      <dd className="text-sm text-gray-900 break-words">{value || "N/A"}</dd>
    </div>
  );
};

const ProposalStatusBadge = ({ status }: { status: string }) => {
  const statusConfig: Record<
    string,
    { bg: string; text: string; label: string }
  > = {
    DRAFT: { bg: "bg-gray-100", text: "text-gray-800", label: "Draft" },
    SENT: { bg: "bg-blue-100", text: "text-blue-800", label: "Sent" },
    VIEWED: { bg: "bg-purple-100", text: "text-purple-800", label: "Viewed" },
    ACCEPTED: { bg: "bg-green-100", text: "text-green-800", label: "Accepted" },
    REJECTED: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
    REVISED: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Revised" },
  };

  const config = statusConfig[status] || {
    bg: "bg-gray-100",
    text: "text-gray-800",
    label: status,
  };

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
};
