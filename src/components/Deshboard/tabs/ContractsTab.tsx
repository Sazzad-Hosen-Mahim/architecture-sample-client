import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ProjectRequest,
    Proposal,
    useGetProposalsByProjectRequestQuery,
    useDeleteProposalMutation,
} from "@/redux/api/adminDashboard/proposalApi";
import {
    FileTextIcon,
    Loader2,
    FilterIcon,
    PlusIcon,
    ExternalLinkIcon,
    CheckCircle2,
    Clock,
    AlertCircle,
    FileCheck,
    Trash2,
} from "lucide-react";
import ContractReviewModal from "../ContractReviewModal";
import { toast } from "sonner";

type ContractsTabProps = {
    project: ProjectRequest;
};

type FilterType = "all" | "proposals" | "amendments";

export default function ContractsTab({ project }: ContractsTabProps) {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<FilterType>("all");
    const [isContractModalOpen, setIsContractModalOpen] = useState(false);
    const [contractProposalId, setContractProposalId] = useState<string>("");

    // Delete proposal state
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Proposal | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [deleteProposal, { isLoading: isDeleting }] = useDeleteProposalMutation();

    // Fetch proposals related to this project
    const { data: proposalsData, isLoading } = useGetProposalsByProjectRequestQuery(project.id);

    const allProposals: Proposal[] = proposalsData?.data || [];

    // Apply filter
    const filteredProposals = allProposals.filter((p) => {
        if (filter === "proposals") return p.proposalType === "NORMAL" || !p.proposalType;
        if (filter === "amendments") return p.proposalType === "AMENDMENT";
        return true;
    });

    // Counts
    const proposalCount = allProposals.filter((p) => p.proposalType === "NORMAL" || !p.proposalType).length;
    const amendmentCount = allProposals.filter((p) => p.proposalType === "AMENDMENT").length;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "ACCEPTED":
                return (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Accepted
                    </span>
                );
            case "SENT":
                return (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                        <Clock className="w-3 h-3" />
                        Sent
                    </span>
                );
            case "DRAFT":
                return (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                        <FileTextIcon className="w-3 h-3" />
                        Draft
                    </span>
                );
            case "REJECTED":
                return (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
                        <AlertCircle className="w-3 h-3" />
                        Rejected
                    </span>
                );
            case "VIEWED":
                return (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
                        <ExternalLinkIcon className="w-3 h-3" />
                        Viewed
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                        {status}
                    </span>
                );
        }
    };

    const getTypeBadge = (proposal: Proposal) => {
        if (proposal.proposalType === "AMENDMENT") {
            return (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                    <FileCheck className="w-3 h-3" />
                    Amendment
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                <FileTextIcon className="w-3 h-3" />
                Proposal
            </span>
        );
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const handleViewContract = (proposalId: string) => {
        setContractProposalId(proposalId);
        setIsContractModalOpen(true);
    };

    const handleOpenDeleteConfirm = (proposal: Proposal) => {
        setDeleteTarget(proposal);
        setDeleteConfirmText("");
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget || deleteConfirmText !== "Delete") return;

        try {
            await deleteProposal(deleteTarget.id).unwrap();
            toast.success(`Proposal "${deleteTarget.proposalNumber}" deleted successfully!`);
            setDeleteConfirmOpen(false);
            setDeleteTarget(null);
            setDeleteConfirmText("");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to delete proposal.");
        }
    };

    return (
        <div className="space-y-6">
            {/* Top bar: filters + Make New Proposal button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FilterIcon className="w-4 h-4 text-gray-400" />
                    <div className="flex bg-gray-100 rounded-lg p-0.5">
                        <button
                            onClick={() => setFilter("all")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === "all"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            All ({allProposals.length})
                        </button>
                        <button
                            onClick={() => setFilter("proposals")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === "proposals"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Proposals ({proposalCount})
                        </button>
                        <button
                            onClick={() => setFilter("amendments")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === "amendments"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Amendments ({amendmentCount})
                        </button>
                    </div>
                </div>

                <button
                    onClick={() => navigate(`/dashboard/new-proposal/${project.id}`)}
                    className="inline-flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
                >
                    <PlusIcon className="w-4 h-4" />
                    Make New Proposal
                </button>
            </div>

            {/* Loading state */}
            {isLoading && (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
                    <span className="text-gray-500 text-sm">Loading contracts...</span>
                </div>
            )}

            {/* Empty state */}
            {!isLoading && filteredProposals.length === 0 && (
                <div className="text-center py-16 space-y-3 border border-dashed border-gray-200 rounded-xl">
                    <FileTextIcon className="w-10 h-10 text-gray-300 mx-auto" />
                    <p className="text-gray-500 text-sm">
                        {filter === "all"
                            ? "No proposals or amendments found for this project."
                            : filter === "proposals"
                                ? "No proposals found for this project."
                                : "No amendments found for this project."}
                    </p>
                </div>
            )}

            {/* Contract cards */}
            {!isLoading && filteredProposals.length > 0 && (
                <div className="space-y-3">
                    {filteredProposals.map((proposal) => (
                        <div
                            key={proposal.id}
                            className="border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-sm transition-all bg-white"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        {getTypeBadge(proposal)}
                                        {getStatusBadge(proposal.status)}
                                        <span className="text-xs text-gray-400 font-mono">
                                            {proposal.proposalNumber}
                                        </span>
                                    </div>

                                    <h4 className="text-sm font-semibold text-gray-900 truncate mb-1">
                                        {proposal.title || proposal.projectName}
                                    </h4>

                                    <p className="text-xs text-gray-500 line-clamp-1 mb-2">
                                        {proposal.projectDescription || "No description available"}
                                    </p>

                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                        <span>Created: {formatDate(proposal.createdAt)}</span>
                                        {proposal.sentAt && <span>Sent: {formatDate(proposal.sentAt)}</span>}
                                        <span className="font-medium text-gray-600">
                                            ${Number(proposal.totalAmount || 0).toLocaleString()}
                                        </span>
                                    </div>

                                    {/* Services preview */}
                                    {proposal.services && proposal.services.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {proposal.services.map((service) => (
                                                <span
                                                    key={service.id}
                                                    className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md"
                                                >
                                                    {service.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2 flex-shrink-0">
                                    {proposal.status === "ACCEPTED" && (
                                        <button
                                            onClick={() => handleViewContract(proposal.id)}
                                            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                                        >
                                            <FileTextIcon className="w-3.5 h-3.5" />
                                            View Contract
                                        </button>
                                    )}
                                    {(proposal.status === "SENT" || proposal.status === "VIEWED") && (
                                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-blue-200 bg-blue-50 text-blue-700">
                                            <Clock className="w-3.5 h-3.5" />
                                            Awaiting Response
                                        </span>
                                    )}
                                    {/* Delete button */}
                                    <button
                                        onClick={() => handleOpenDeleteConfirm(proposal)}
                                        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Contract Review Modal */}
            <ContractReviewModal
                isOpen={isContractModalOpen}
                onClose={() => setIsContractModalOpen(false)}
                proposalId={contractProposalId}
            />

            {/* Delete Confirmation Modal */}
            {deleteConfirmOpen && deleteTarget && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5">
                        <div className="text-center">
                            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Delete Proposal</h3>
                            <p className="text-sm text-gray-500 mt-2">
                                Are you sure you want to delete proposal{" "}
                                <span className="font-semibold text-gray-700">{deleteTarget.proposalNumber}</span>?
                                This action cannot be undone.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Type <span className="font-bold text-red-600">"Delete"</span> to confirm
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder="Delete"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                autoFocus
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setDeleteConfirmOpen(false);
                                    setDeleteTarget(null);
                                    setDeleteConfirmText("");
                                }}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={deleteConfirmText !== "Delete" || isDeleting}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    "Delete Proposal"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
