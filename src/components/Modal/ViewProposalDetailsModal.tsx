import { ProposalService } from "@/redux/api/adminDashboard/proposalApi";
import {
    useGetAmendmentsQuery,
    useGetAllProposalsForProposalQuery,
    Amendment,
} from "@/redux/api/amendmentApi";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

interface ViewProposalDetailsModalProps {
    proposal: any;
    onClose: () => void;
}

const ViewProposalDetailsModal = ({ proposal, onClose }: ViewProposalDetailsModalProps) => {
    // Amendment queries
    const { data: amendmentsData, isLoading: isLoadingAmendments } = useGetAmendmentsQuery({ proposalId: proposal.id });
    const { data: allProposalsData, isLoading: isLoadingAllProposals } = useGetAllProposalsForProposalQuery(proposal.id);

    const amendmentsRaw = amendmentsData?.data;
    const amendments = Array.isArray(amendmentsRaw) ? amendmentsRaw : [];

    // Backend returns { normalProposal, amendmentProposals, totalProposals }
    const amendmentProposals = Array.isArray(allProposalsData?.data?.amendmentProposals)
        ? allProposalsData.data.amendmentProposals
        : [];

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };


    const getApprovalStatusBadge = (status: string) => {
        const config: Record<string, { bg: string; text: string; label: string }> = {
            PENDING_APPROVAL: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending Approval" },
            APPROVED: { bg: "bg-green-100", text: "text-green-800", label: "Approved" },
            REJECTED: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
        };
        const c = config[status] || { bg: "bg-gray-100", text: "text-gray-800", label: status };
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${c.bg} ${c.text}`}>
                {c.label}
            </span>
        );
    };

    const getAmendmentStatusBadge = (status: string) => {
        const config: Record<string, { bg: string; text: string; label: string }> = {
            PENDING: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending" },
            APPROVED: { bg: "bg-green-100", text: "text-green-800", label: "Approved" },
            REJECTED: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
            UNDER_REVIEW: { bg: "bg-blue-100", text: "text-blue-800", label: "Under Review" },
            COMPLETED: { bg: "bg-teal-100", text: "text-teal-800", label: "Completed" },
        };
        const c = config[status] || { bg: "bg-gray-100", text: "text-gray-800", label: status };
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${c.bg} ${c.text}`}>
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
            <span className={`px-2 py-1 rounded text-xs font-medium ${c.bg} ${c.text}`}>
                {urgency}
            </span>
        );
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto bg-white p-0 border-none shadow-2xl">
                <DialogHeader className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10 shadow-sm">
                    <div>
                        <DialogTitle className="text-2xl font-bold text-gray-800">Proposal Details</DialogTitle>
                        <DialogDescription className="text-sm text-gray-500">Comprehensive overview of the selected proposal.</DialogDescription>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    {/* Proposal Information */}
                    <section>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
                            Proposal Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <InfoField label="Proposal Number" value={proposal.proposalNumber} />
                            <InfoField label="Status" value={<ProposalStatusBadge status={proposal.status} />} />
                            <InfoField label="Title" value={proposal.title} />
                            <InfoField label="Created At" value={formatDate(proposal.createdAt)} />
                            <InfoField label="Sent At" value={formatDate(proposal.sentAt)} />
                            <InfoField label="Viewed At" value={formatDate(proposal.viewedAt)} />
                        </div>
                    </section>

                    {/* Client Information */}
                    <section>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
                            Client Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <InfoField label="Client Name" value={proposal.clientName} />
                            <InfoField label="Company" value={proposal.clientCompany || "N/A"} />
                            <InfoField label="Email" value={proposal.clientEmail} />
                            <InfoField label="Phone" value={proposal.clientPhone} />
                        </div>
                    </section>

                    {/* Project Information */}
                    <section>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
                            Project Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <InfoField label="Project Name" value={proposal.projectName} />
                            <InfoField label="Location" value={proposal.projectLocation} />
                            <InfoField label="Service Type" value={proposal.serviceType?.replace(/_/g, ' ')} />
                            <InfoField label="Category" value={proposal.projectCategory} />
                            <InfoField label="Square Footage" value={proposal.squareFootage} />
                            <InfoField label="Budget Range" value={proposal.budgetRange} />
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
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
                                Services
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full border border-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Service</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">Rate</th>
                                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-700">Quantity</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">Amount</th>
                                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-700">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {proposal.services.map((service: ProposalService) => (
                                            <tr key={service.id}>
                                                <td className="px-4 py-2 text-sm">
                                                    <div>
                                                        <div className="font-medium">{service.name}</div>
                                                        {service.description && (
                                                            <div className="text-xs text-gray-500">{service.description}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 text-sm text-right">${service.rate}</td>
                                                <td className="px-4 py-2 text-sm text-center">{service.quantity}</td>
                                                <td className="px-4 py-2 text-sm text-right font-medium">${service.amount}</td>
                                                <td className="px-4 py-2 text-sm text-center">
                                                    {getApprovalStatusBadge(service.approvalStatus)}
                                                    {service.approvalStatus === "REJECTED" && service.rejectionReason && (
                                                        <div className="text-xs text-red-500 mt-1 max-w-[200px]" title={service.rejectionReason}>
                                                            {service.rejectionReason}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* Financial Summary */}
                    <section>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
                            Financial Summary
                        </h3>
                        <div className="bg-gray-50 p-4 rounded space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="font-medium">${proposal.subtotal}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tax Amount:</span>
                                <span className="font-medium">${proposal.taxAmount || '0'}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold border-t pt-2">
                                <span>Total Amount:</span>
                                <span className="text-green-600">${proposal.totalAmount}</span>
                            </div>
                        </div>
                    </section>

                    {/* Created By */}
                    <section>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
                            Created By
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <InfoField label="Name" value={proposal.createdBy?.name} />
                            <InfoField label="Email" value={proposal.createdBy?.email} />
                        </div>
                    </section>

                    {/* ─── Amendments Section ─── */}
                    <section>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
                            Amendments
                        </h3>
                        {isLoadingAmendments ? (
                            <div className="text-center text-gray-500 py-4">Loading amendments...</div>
                        ) : amendments.length === 0 ? (
                            <div className="text-center text-gray-400 py-4">No amendments for this proposal.</div>
                        ) : (
                            <div className="space-y-4">
                                {amendments.map((amendment: Amendment) => (
                                    <div key={amendment.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{amendment.projectName}</h4>
                                                <p className="text-sm text-gray-600 mt-1">{amendment.description}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getUrgencyBadge(amendment.urgency)}
                                                {getAmendmentStatusBadge(amendment.status)}
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-600 mb-2">
                                            <span className="font-medium text-gray-700">Services:</span> {amendment.services}
                                        </div>
                                        {amendment.reviewNotes && (
                                            <div className="text-sm text-gray-600 mb-2 bg-white p-2 rounded border border-gray-100">
                                                <span className="font-medium text-gray-700">Review Notes:</span> {amendment.reviewNotes}
                                            </div>
                                        )}
                                        {/* Show linked amendment proposal info */}
                                        {amendment.amendmentProposal && (
                                            <div className="text-sm mb-2 bg-blue-50 p-2 rounded border border-blue-100">
                                                <span className="font-medium text-blue-800">Amendment Proposal:</span>{" "}
                                                <span className="text-blue-700">{amendment.amendmentProposal.proposalNumber}</span>
                                                <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${amendment.amendmentProposal.status === "ACCEPTED" ? "bg-green-100 text-green-800" :
                                                    amendment.amendmentProposal.status === "SENT" ? "bg-blue-100 text-blue-800" :
                                                        "bg-gray-100 text-gray-800"
                                                    }`}>
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
                    <section>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
                            Amendment Proposals
                        </h3>
                        {isLoadingAllProposals ? (
                            <div className="text-center text-gray-500 py-4">Loading proposals...</div>
                        ) : amendmentProposals.length === 0 ? (
                            <div className="text-center text-gray-400 py-4">No amendment proposals yet.</div>
                        ) : (
                            <div className="space-y-3">
                                {amendmentProposals.map((p: any) => (
                                    <div key={p.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{p.title || p.projectName}</h4>
                                                <p className="text-sm text-gray-500 mt-1">{p.proposalNumber}</p>
                                                <p className="text-sm text-gray-500 mt-1">{p.projectDescription || "No description"}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${p.status === "ACCEPTED" ? "bg-green-100 text-green-800" :
                                                p.status === "SENT" ? "bg-blue-100 text-blue-800" :
                                                    p.status === "DRAFT" ? "bg-gray-100 text-gray-800" :
                                                        "bg-yellow-100 text-yellow-800"
                                                }`}>
                                                {p.status}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                                            <div>
                                                <span className="text-gray-500">Budget:</span>{" "}
                                                <span className="font-medium">{p.budgetRange || p.totalAmount || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Timeline:</span>{" "}
                                                <span className="font-medium">{p.expectedTimeline || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Created:</span>{" "}
                                                <span className="font-medium">{formatDate(p.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors cursor-pointer font-medium"
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
        <div className={fullWidth ? "col-span-2" : ""}>
            <dt className="text-xs font-medium text-gray-500 mb-1">{label}</dt>
            <dd className="text-sm text-gray-900">{value || "N/A"}</dd>
        </div>
    );
};

const ProposalStatusBadge = ({ status }: { status: string }) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
        DRAFT: { bg: "bg-gray-100", text: "text-gray-800", label: "Draft" },
        SENT: { bg: "bg-blue-100", text: "text-blue-800", label: "Sent" },
        VIEWED: { bg: "bg-purple-100", text: "text-purple-800", label: "Viewed" },
        ACCEPTED: { bg: "bg-green-100", text: "text-green-800", label: "Accepted" },
        REJECTED: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
        REVISED: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Revised" },
    };

    const config = statusConfig[status] || { bg: "bg-gray-100", text: "text-gray-800", label: status };

    return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
            {config.label}
        </span>
    );
};