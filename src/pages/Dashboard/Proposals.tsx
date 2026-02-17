import React, { useState } from 'react';
import { useGetAdminViewAllProposalsQuery, Proposal } from "@/redux/api/adminDashboard/proposalApi";
import {
    useGetAmendmentsQuery,
    useReviewAmendmentMutation,
    useCreateProposalFromAmendmentMutation,
    useCompleteAmendmentMutation,
    useGetAllProposalsForProposalQuery,
    Amendment,
} from "@/redux/api/amendmentApi";

const Proposals = () => {
    const { data: proposalsData, isLoading, isError } = useGetAdminViewAllProposalsQuery();
    const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const proposals = proposalsData?.data ? proposalsData?.data : [];

    console.log(proposals, "proposal dataaaaaaa")

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleViewDetails = (proposal: Proposal) => {
        setSelectedProposal(proposal);
        setIsModalOpen(true);
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case "DRAFT":
                return "bg-gray-100 text-gray-800";
            case "SENT":
                return "bg-blue-100 text-blue-800";
            case "VIEWED":
                return "bg-purple-100 text-purple-800";
            case "ACCEPTED":
                return "bg-green-100 text-green-800";
            case "REJECTED":
                return "bg-red-100 text-red-800";
            case "REVISED":
                return "bg-yellow-100 text-yellow-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 text-center text-gray-500">
                Loading proposals...
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-8 text-center text-red-500">
                Error loading proposals. Please try again.
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">All Proposals</h1>
                <p className="text-sm text-gray-500 mt-1">Manage and view all client proposals</p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Proposal #
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Project Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Client
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Created Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total Amount
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {proposals?.map((proposal: Proposal) => (
                            <tr key={proposal.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {proposal.proposalNumber}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {proposal.projectRequest.projectName}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        {proposal.clientName}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(proposal.status)}`}>
                                        {proposal.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(proposal.createdAt)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    ${proposal.totalAmount}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    <button
                                        onClick={() => handleViewDetails(proposal)}
                                        className="text-blue-600 hover:text-blue-900 font-medium"
                                    >
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {proposals.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No proposals found
                    </div>
                )}
            </div>

            {isModalOpen && selectedProposal && (
                <ProposalDetailsModal
                    proposal={selectedProposal}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedProposal(null);
                    }}
                />
            )}
        </div>
    );
};

interface ProposalDetailsModalProps {
    proposal: Proposal;
    onClose: () => void;
}

const ProposalDetailsModal = ({ proposal, onClose }: ProposalDetailsModalProps) => {
    // Amendment state
    const { data: amendmentsData, isLoading: isLoadingAmendments } = useGetAmendmentsQuery({ proposalId: proposal.id });
    const [reviewAmendment, { isLoading: isReviewing }] = useReviewAmendmentMutation();
    const [createProposalFromAmendment, { isLoading: isCreatingProposal }] = useCreateProposalFromAmendmentMutation();
    const [completeAmendment, { isLoading: isCompleting }] = useCompleteAmendmentMutation();
    const { data: allProposalsData, isLoading: isLoadingAllProposals } = useGetAllProposalsForProposalQuery(proposal.id);

    // Review modal state
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewingAmendment, setReviewingAmendment] = useState<Amendment | null>(null);
    const [reviewAction, setReviewAction] = useState<"APPROVED" | "REJECTED">("APPROVED");
    const [reviewNotes, setReviewNotes] = useState("");

    // Create proposal modal state
    const [isCreateProposalModalOpen, setIsCreateProposalModalOpen] = useState(false);
    const [creatingForAmendment, setCreatingForAmendment] = useState<Amendment | null>(null);
    const [proposalForm, setProposalForm] = useState({
        name: "",
        description: "",
        budgetRange: "",
        expectedTimeline: "",
        taxRate: 8,
        notes: "",
    });

    const amendmentsRaw = amendmentsData?.data;
    const amendments = Array.isArray(amendmentsRaw) ? amendmentsRaw : [];
    const allProposalsRaw = allProposalsData?.data;
    const allProposals = Array.isArray(allProposalsRaw) ? allProposalsRaw : [];

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

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case "DRAFT":
                return "bg-gray-100 text-gray-800";
            case "SENT":
                return "bg-blue-100 text-blue-800";
            case "VIEWED":
                return "bg-purple-100 text-purple-800";
            case "ACCEPTED":
                return "bg-green-100 text-green-800";
            case "REJECTED":
                return "bg-red-100 text-red-800";
            case "REVISED":
                return "bg-yellow-100 text-yellow-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getAmendmentStatusBadge = (status: string) => {
        const config: Record<string, { bg: string; text: string; label: string }> = {
            PENDING: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending" },
            APPROVED: { bg: "bg-green-100", text: "text-green-800", label: "Approved" },
            REJECTED: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
            IN_PROGRESS: { bg: "bg-blue-100", text: "text-blue-800", label: "In Progress" },
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

    // Review handlers
    const handleOpenReview = (amendment: Amendment, action: "APPROVED" | "REJECTED") => {
        setReviewingAmendment(amendment);
        setReviewAction(action);
        setReviewNotes("");
        setIsReviewModalOpen(true);
    };

    const handleSubmitReview = async () => {
        if (!reviewingAmendment || !reviewNotes.trim()) return;
        try {
            await reviewAmendment({
                amendmentId: reviewingAmendment.id,
                action: reviewAction,
                reviewNotes: reviewNotes.trim(),
            }).unwrap();
            setIsReviewModalOpen(false);
            setReviewingAmendment(null);
            setReviewNotes("");
        } catch (error) {
            console.error("Failed to review amendment:", error);
        }
    };

    // Create proposal handlers
    const handleOpenCreateProposal = (amendment: Amendment) => {
        setCreatingForAmendment(amendment);
        setProposalForm({
            name: "",
            description: "",
            budgetRange: "",
            expectedTimeline: "",
            taxRate: 8,
            notes: "",
        });
        setIsCreateProposalModalOpen(true);
    };

    const handleSubmitCreateProposal = async () => {
        if (!creatingForAmendment) return;
        try {
            await createProposalFromAmendment({
                amendmentId: creatingForAmendment.id,
                ...proposalForm,
            }).unwrap();
            setIsCreateProposalModalOpen(false);
            setCreatingForAmendment(null);
            alert("Proposal created successfully from amendment!");
        } catch (error) {
            console.error("Failed to create proposal:", error);
            alert("Failed to create proposal.");
        }
    };

    // Complete handler
    const handleComplete = async (amendmentId: string) => {
        if (!confirm("Are you sure you want to mark this amendment as completed?")) return;
        try {
            await completeAmendment(amendmentId).unwrap();
        } catch (error) {
            console.error("Failed to complete amendment:", error);
        }
    };

    return (
        <>
            <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Proposal Details</h2>
                            <p className="text-sm text-gray-500 mt-1">{proposal.proposalNumber}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-2xl leading-none cursor-pointer"
                        >
                            ×
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Proposal Information */}
                        <section>
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                                Proposal Information
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <InfoField label="Title" value={proposal.title} />
                                <InfoField label="Status" value={
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(proposal.status)}`}>
                                        {proposal.status}
                                    </span>
                                } />
                                <InfoField label="Created At" value={formatDate(proposal.createdAt)} />
                                <InfoField label="Sent At" value={formatDate(proposal.sentAt)} />
                                <InfoField label="Viewed At" value={formatDate(proposal.viewedAt)} />
                                <InfoField label="Responded At" value={formatDate(proposal.respondedAt)} />
                            </div>
                        </section>

                        {/* Client Information */}
                        <section>
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">
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
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">
                                Project Information
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <InfoField label="Project Name" value={proposal.projectName} />
                                <InfoField label="Location" value={proposal.projectLocation} />
                                <InfoField label="Service Type" value={proposal.serviceType?.replace(/_/g, ' ')} />
                                <InfoField label="Category" value={proposal.projectCategory} />
                                <InfoField label="Square Footage" value={proposal.squareFootage} />
                                <InfoField label="Budget Range" value={proposal.budgetRange} />
                                <InfoField label="Expected Timeline" value={proposal.expectedTimeline} />
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
                                <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                                    Services
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {proposal.services.map((service: any) => (
                                        <div
                                            key={service.id}
                                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-bold text-gray-900 text-sm">
                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 mx-1 py-1 rounded">
                                                        #{service.order}
                                                    </span> {service.name}
                                                </h4>
                                                <p className={`text-xs px-2 py-1 rounded ${service?.approvalStatus === "PENDING" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                                                    {service?.approvalStatus === "PENDING" ? "Pending" : "Approved"}
                                                </p>

                                            </div>
                                            {service.description && (
                                                <p className="text-xs text-gray-600 mb-2">
                                                    {service.description}
                                                </p>
                                            )}
                                            <div className="mt-2 pt-2 border-t border-gray-100">
                                                <h1 className="text-lg font-semibold ">
                                                    Price: <span className="text-green-600 font-bold">${service.amount}</span>
                                                </h1>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Financial Summary */}
                        <section>
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                                Financial Summary
                            </h3>
                            <div className="bg-gray-50 p-4 rounded space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span className="font-medium">${proposal.subtotal}</span>
                                </div>
                                {proposal.taxRate && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tax Rate:</span>
                                        <span className="font-medium">{proposal.taxRate}%</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tax Amount:</span>
                                    <span className="font-medium">${proposal.taxAmount || '0'}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                                    <span>Total Amount:</span>
                                    <span className="text-green-600">${proposal.totalAmount}</span>
                                </div>
                                {proposal.paymentMethod && (
                                    <div className="flex justify-between pt-2 border-t border-gray-200">
                                        <span className="text-gray-600">Payment Method:</span>
                                        <span className="font-medium">{proposal.paymentMethod.replace(/_/g, ' ')}</span>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Created By */}
                        <section>
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                                Created By
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <InfoField label="Name" value={proposal.createdBy?.name} />
                                <InfoField label="Email" value={proposal.createdBy?.email} />
                            </div>
                        </section>

                        {/* Notes and Terms */}
                        {(proposal.notes || proposal.termsAndConditions) && (
                            <section>
                                <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                                    Additional Information
                                </h3>
                                {proposal.notes && (
                                    <div className="mb-4">
                                        <InfoField label="Notes" value={proposal.notes} fullWidth />
                                    </div>
                                )}
                                {proposal.termsAndConditions && (
                                    <div>
                                        <InfoField label="Terms & Conditions" value={proposal.termsAndConditions} fullWidth />
                                    </div>
                                )}
                            </section>
                        )}

                        {/* ─── Amendments Section ─── */}
                        <section>
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                                Amendments
                            </h3>
                            {isLoadingAmendments ? (
                                <div className="text-center text-gray-500 py-4">Loading amendments...</div>
                            ) : amendments.length === 0 ? (
                                <div className="text-center text-gray-400 py-4">No amendments found for this proposal.</div>
                            ) : (
                                <div className="space-y-4">
                                    {amendments.map((amendment: Amendment) => (
                                        <div key={amendment.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">{amendment.projectName}</h4>
                                                    <p className="text-sm text-gray-600 mt-1">{amendment.description}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {getUrgencyBadge(amendment.urgency)}
                                                    {getAmendmentStatusBadge(amendment.status)}
                                                </div>
                                            </div>

                                            <div className="text-sm text-gray-600 mb-3">
                                                <span className="font-medium text-gray-700">Services:</span> {amendment.services}
                                            </div>

                                            {amendment.reviewNotes && (
                                                <div className="text-sm text-gray-600 mb-3 bg-white p-2 rounded border border-gray-100">
                                                    <span className="font-medium text-gray-700">Review Notes:</span> {amendment.reviewNotes}
                                                </div>
                                            )}

                                            <div className="text-xs text-gray-400 mb-3">
                                                Created: {formatDate(amendment.createdAt)}
                                            </div>

                                            {/* Action buttons */}
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {amendment.status === "PENDING" && (
                                                    <>
                                                        <button
                                                            onClick={() => handleOpenReview(amendment, "APPROVED")}
                                                            disabled={isReviewing}
                                                            className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenReview(amendment, "REJECTED")}
                                                            disabled={isReviewing}
                                                            className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {amendment.status === "APPROVED" && (
                                                    <>
                                                        <button
                                                            onClick={() => handleOpenCreateProposal(amendment)}
                                                            disabled={isCreatingProposal}
                                                            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                        >
                                                            Create Proposal
                                                        </button>
                                                        <button
                                                            onClick={() => handleComplete(amendment.id)}
                                                            disabled={isCompleting}
                                                            className="px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                        >
                                                            {isCompleting ? "Completing..." : "Complete"}
                                                        </button>
                                                    </>
                                                )}
                                                {amendment.status === "IN_PROGRESS" && (
                                                    <button
                                                        onClick={() => handleComplete(amendment.id)}
                                                        disabled={isCompleting}
                                                        className="px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                    >
                                                        {isCompleting ? "Completing..." : "Mark Complete"}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* ─── All Proposals for this Proposal (Amendment Proposals) ─── */}
                        <section>
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                                All Proposals (Including Amendment Proposals)
                            </h3>
                            {isLoadingAllProposals ? (
                                <div className="text-center text-gray-500 py-4">Loading proposals...</div>
                            ) : allProposals.length === 0 ? (
                                <div className="text-center text-gray-400 py-4">No amendment proposals found.</div>
                            ) : (
                                <div className="space-y-3">
                                    {allProposals.map((p: any) => (
                                        <div key={p.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">{p.name || p.title || p.projectName}</h4>
                                                    <p className="text-sm text-gray-500 mt-1">{p.description || p.projectDescription || "No description"}</p>
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
                    <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-300 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>

            {/* Review Amendment Modal */}
            {isReviewModalOpen && reviewingAmendment && (
                <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-800">
                                {reviewAction === "APPROVED" ? "Approve" : "Reject"} Amendment
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Amendment: <span className="font-medium text-gray-700">{reviewingAmendment.projectName}</span>
                            </p>
                        </div>
                        <div className="px-6 py-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Review Notes <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                placeholder="Provide your review notes..."
                                rows={4}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            />
                        </div>
                        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
                            <button
                                onClick={() => {
                                    setIsReviewModalOpen(false);
                                    setReviewingAmendment(null);
                                    setReviewNotes("");
                                }}
                                disabled={isReviewing}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitReview}
                                disabled={isReviewing || !reviewNotes.trim()}
                                className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${reviewAction === "APPROVED"
                                    ? "bg-green-600 hover:bg-green-700 border border-green-600"
                                    : "bg-red-600 hover:bg-red-700 border border-red-600"
                                    }`}
                            >
                                {isReviewing
                                    ? "Processing..."
                                    : reviewAction === "APPROVED"
                                        ? "Confirm Approve"
                                        : "Confirm Reject"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Proposal From Amendment Modal */}
            {isCreateProposalModalOpen && creatingForAmendment && (
                <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white px-6 py-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-800">Create Proposal from Amendment</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Amendment: <span className="font-medium text-gray-700">{creatingForAmendment.projectName}</span>
                            </p>
                        </div>
                        <div className="px-6 py-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Proposal Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={proposalForm.name}
                                    onChange={(e) => setProposalForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. Garage Extension Amendment"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={proposalForm.description}
                                    onChange={(e) => setProposalForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Describe the proposal..."
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Budget Range <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={proposalForm.budgetRange}
                                    onChange={(e) => setProposalForm(prev => ({ ...prev, budgetRange: e.target.value }))}
                                    placeholder="e.g. 35,000 - 50,000"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Expected Timeline <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={proposalForm.expectedTimeline}
                                    onChange={(e) => setProposalForm(prev => ({ ...prev, expectedTimeline: e.target.value }))}
                                    placeholder="e.g. 6-8 weeks"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tax Rate (%)
                                </label>
                                <input
                                    type="number"
                                    value={proposalForm.taxRate}
                                    onChange={(e) => setProposalForm(prev => ({ ...prev, taxRate: Number(e.target.value) }))}
                                    placeholder="e.g. 8"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes
                                </label>
                                <textarea
                                    value={proposalForm.notes}
                                    onChange={(e) => setProposalForm(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Additional notes..."
                                    rows={2}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                />
                            </div>
                        </div>
                        <div className="sticky bottom-0 px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
                            <button
                                onClick={() => {
                                    setIsCreateProposalModalOpen(false);
                                    setCreatingForAmendment(null);
                                }}
                                disabled={isCreatingProposal}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitCreateProposal}
                                disabled={isCreatingProposal || !proposalForm.name.trim() || !proposalForm.description.trim() || !proposalForm.budgetRange.trim()}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCreatingProposal ? "Creating..." : "Create Proposal"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

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

export default Proposals;