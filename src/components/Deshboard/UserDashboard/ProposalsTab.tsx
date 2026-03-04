import { useState, useRef, useEffect } from 'react';
import {
    useGetMyProposalsQuery,
    useChangeProposalStatusMutation,
    useSignProposalMutation
} from "@/redux/api/adminDashboard/proposalApi";
import {
    useCreateAmendmentMutation,
    useGetAllProposalsForProposalQuery,
    useGetAmendmentsQuery,
    AmendmentUrgency,
} from "@/redux/api/amendmentApi";
import ViewProposalDetailsModal from '@/components/Modal/ViewProposalDetailsModal';
import ContractReviewModal from '@/components/Deshboard/ContractReviewModal';
import { toast } from 'sonner';
import { MoreVertical, Eye, FileEdit, FileStack, FileSignature, CheckCircle, XCircle } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

interface ProposalsTabProps {
    searchQuery?: string;
}

const ProposalsTab = ({ searchQuery = "" }: ProposalsTabProps) => {
    const { data: proposalsData, isLoading, isError, refetch } = useGetMyProposalsQuery();
    const [changeProposalStatus, { isLoading: isUpdating }] = useChangeProposalStatusMutation();
    const [selectedProposal, setSelectedProposal] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Contract modal state
    const [isContractModalOpen, setIsContractModalOpen] = useState(false);
    const [contractProposalId, setContractProposalId] = useState<string>("");

    // Amendment modal state
    const [isAmendmentModalOpen, setIsAmendmentModalOpen] = useState(false);
    const [amendmentProposalId, setAmendmentProposalId] = useState<string>("");
    const [amendmentForm, setAmendmentForm] = useState({
        projectName: "",
        description: "",
        services: "",
        urgency: "MEDIUM" as AmendmentUrgency,
    });
    const [createAmendment, { isLoading: isCreatingAmendment }] = useCreateAmendmentMutation();

    // Amendment proposals modal
    const [isAmendmentProposalsOpen, setIsAmendmentProposalsOpen] = useState(false);
    const [viewAmendmentProposalId, setViewAmendmentProposalId] = useState<string>("");

    // Dropdown state
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    const proposals = proposalsData?.data || [];

    const filteredProposals = searchQuery
        ? proposals.filter(proposal =>
            Object.values(proposal).some(value =>
                value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
            )
        )
        : proposals;

    const handleAccept = async (proposal: any) => {
        setOpenDropdownId(null);
        // If contract is not signed and proposal has contract sections, open modal first
        if (!proposal.clientContractSignature && proposal.contractSections) {
            setContractProposalId(proposal.id);
            setIsContractModalOpen(true);
            return;
        }

        try {
            await changeProposalStatus({ id: proposal.id, status: "ACCEPTED" }).unwrap();
            toast.success("Proposal accepted successfully!");
        } catch (error: any) {
            console.error("Failed to accept proposal:", error);
            toast.error(error?.data?.message || "Failed to accept proposal");
        }
    };

    const handleOpenContract = (proposalId: string) => {
        setOpenDropdownId(null);
        setContractProposalId(proposalId);
        setIsContractModalOpen(true);
    };

    const handleContractSigned = () => {
        refetch();
    };

    const handleReject = async (proposalId: string) => {
        setOpenDropdownId(null);
        try {
            await changeProposalStatus({ id: proposalId, status: "REJECTED" }).unwrap();
            toast.success("Proposal rejected.");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to reject proposal");
        }
    };

    const handleViewDetails = (proposal: any) => {
        setOpenDropdownId(null);
        setSelectedProposal(proposal);
        setIsModalOpen(true);
    };

    const handleOpenAmendmentModal = (proposalId: string) => {
        setOpenDropdownId(null);
        setAmendmentProposalId(proposalId);
        setAmendmentForm({ projectName: "", description: "", services: "", urgency: "MEDIUM" });
        setIsAmendmentModalOpen(true);
    };

    const handleSubmitAmendment = async () => {
        if (!amendmentForm.projectName.trim() || !amendmentForm.description.trim() || !amendmentForm.services.trim()) {
            toast.warning("Please fill all fields.");
            return;
        }
        try {
            await createAmendment({
                proposalId: amendmentProposalId,
                ...amendmentForm,
            }).unwrap();
            setIsAmendmentModalOpen(false);
            setAmendmentForm({ projectName: "", description: "", services: "", urgency: "MEDIUM" });
            toast.success("Amendment submitted successfully!");
        } catch (error) {
            console.error("Failed to create amendment:", error);
            toast.error("Failed to submit amendment.");
        }
    };

    const handleViewAmendmentProposals = (proposalId: string) => {
        setOpenDropdownId(null);
        setViewAmendmentProposalId(proposalId);
        setIsAmendmentProposalsOpen(true);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
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

    if (filteredProposals.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                No proposals found
            </div>
        );
    }

    return (
        <>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full bg-white text-sm">
                    <thead className="bg-gray-100 text-gray-700">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium">Proposal #</th>
                            <th className="px-4 py-3 text-left font-medium">Project</th>
                            <th className="px-4 py-3 text-left font-medium">Client</th>
                            <th className="px-4 py-3 text-left font-medium">Submitted</th>
                            <th className="px-4 py-3 text-left font-medium">Amount</th>
                            <th className="px-4 py-3 text-left font-medium">Status</th>
                            <th className="px-4 py-3 text-center font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-300">
                        {filteredProposals.map((proposal) => (
                            <tr key={proposal.id} className="hover:bg-gray-50 transition-colors duration-150">
                                <td className="px-4 py-3 font-medium">{proposal.proposalNumber}</td>
                                <td className="px-4 py-3">
                                    <div>
                                        <div className="font-medium">{proposal.title}</div>
                                        <div className="text-xs text-gray-500">
                                            {proposal.projectName}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div>
                                        <div className="font-medium">{proposal.clientName}</div>
                                        <div className="text-xs text-gray-500">{proposal.clientEmail}</div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">{formatDate(proposal.createdAt)}</td>
                                <td className="px-4 py-3 font-medium">${proposal.totalAmount}</td>
                                <td className="px-4 py-3">
                                    <ProposalStatusBadge status={proposal.status} />
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-center">
                                        <ThreeDotMenu
                                            proposal={proposal}
                                            isOpen={openDropdownId === proposal.id}
                                            onToggle={() => setOpenDropdownId(openDropdownId === proposal.id ? null : proposal.id)}
                                            onClose={() => setOpenDropdownId(null)}
                                            onView={() => handleViewDetails(proposal)}
                                            onAmendment={() => handleOpenAmendmentModal(proposal.id)}
                                            onProposals={() => handleViewAmendmentProposals(proposal.id)}
                                            onContract={() => handleOpenContract(proposal.id)}
                                            onAccept={() => handleAccept(proposal)}
                                            onReject={() => handleReject(proposal.id)}
                                            isUpdating={isUpdating}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* View Proposal Details Modal */}
            {isModalOpen && selectedProposal && (
                <ViewProposalDetailsModal
                    proposal={selectedProposal}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedProposal(null);
                    }}
                />
            )}

            {/* Create Amendment Modal */}
            {isAmendmentModalOpen && (
                <CreateAmendmentModal
                    isLoading={isCreatingAmendment}
                    form={amendmentForm}
                    onChange={(field, value) => setAmendmentForm(prev => ({ ...prev, [field]: value }))}
                    onSubmit={handleSubmitAmendment}
                    onClose={() => setIsAmendmentModalOpen(false)}
                />
            )}

            {/* Amendment Proposals Modal */}
            {isAmendmentProposalsOpen && viewAmendmentProposalId && (
                <AmendmentProposalsModal
                    proposalId={viewAmendmentProposalId}
                    onClose={() => {
                        setIsAmendmentProposalsOpen(false);
                        setViewAmendmentProposalId("");
                    }}
                />
            )}

            {/* Contract Review Modal */}
            <ContractReviewModal
                isOpen={isContractModalOpen}
                onClose={() => setIsContractModalOpen(false)}
                proposalId={contractProposalId}
                onContractSigned={handleContractSigned}
            />
        </>
    );
};

export default ProposalsTab;


/* ─── Three-Dot Menu Component ─── */

interface ThreeDotMenuProps {
    proposal: any;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    onView: () => void;
    onAmendment: () => void;
    onProposals: () => void;
    onContract: () => void;
    onAccept: () => void;
    onReject: () => void;
    isUpdating: boolean;
}

const ThreeDotMenu = ({
    proposal,
    isOpen,
    onToggle,
    onClose,
    onView,
    onAmendment,
    onProposals,
    onContract,
    onAccept,
    onReject,
    isUpdating,
}: ThreeDotMenuProps) => {
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose]);

    const canAcceptReject = proposal.status === "SENT" || proposal.status === "VIEWED";

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={onToggle}
                className="p-1.5 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
                title="Actions"
            >
                <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1 animate-in fade-in-0 zoom-in-95">
                    <button
                        onClick={onView}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <Eye className="w-4 h-4 text-blue-500" />
                        View Details
                    </button>
                    <button
                        onClick={onAmendment}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <FileEdit className="w-4 h-4 text-indigo-500" />
                        Request Amendment
                    </button>
                    <button
                        onClick={onProposals}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <FileStack className="w-4 h-4 text-teal-500" />
                        View Proposals
                    </button>
                    <button
                        onClick={onContract}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <FileSignature className="w-4 h-4 text-amber-500" />
                        View Contract
                    </button>
                    {canAcceptReject && (
                        <>
                            <div className="border-t border-gray-100 my-1" />
                            <button
                                onClick={onAccept}
                                disabled={isUpdating}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                Accept Proposal
                            </button>
                            <button
                                onClick={onReject}
                                disabled={isUpdating}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <XCircle className="w-4 h-4 text-red-600" />
                                Reject Proposal
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};


/* ─── Create Amendment Modal ─── */

interface CreateAmendmentModalProps {
    isLoading: boolean;
    form: {
        projectName: string;
        description: string;
        services: string;
        urgency: AmendmentUrgency;
    };
    onChange: (field: string, value: string) => void;
    onSubmit: () => void;
    onClose: () => void;
}

const CreateAmendmentModal = ({ isLoading, form, onChange, onSubmit, onClose }: CreateAmendmentModalProps) => {
    return (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/40 bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full">
                {/* Header */}
                <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">Request Amendment</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Submit an amendment request for this proposal.
                    </p>
                </div>

                {/* Form */}
                <div className="px-6 py-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Project Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.projectName}
                            onChange={(e) => onChange("projectName", e.target.value)}
                            placeholder="e.g. Additional Garage Extension"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={form.description}
                            onChange={(e) => onChange("description", e.target.value)}
                            placeholder="Describe the amendment you need..."
                            rows={3}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Services <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={form.services}
                            onChange={(e) => onChange("services", e.target.value)}
                            placeholder="e.g. Architectural design, structural engineering review, permit assistance"
                            rows={2}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Urgency <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={form.urgency}
                            onChange={(e) => onChange("urgency", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                        </select>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={isLoading || !form.projectName.trim() || !form.description.trim() || !form.services.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Submitting..." : "Submit Amendment"}
                    </button>
                </div>
            </div>
        </div>
    );
};


/* ─── Amendment Proposals Modal (Client view) ─── */

interface AmendmentProposalsModalProps {
    proposalId: string;
    onClose: () => void;
}

const AmendmentProposalsModal = ({ proposalId, onClose }: AmendmentProposalsModalProps) => {
    const { data, isLoading } = useGetAllProposalsForProposalQuery(proposalId);
    const { data: amendmentsData, isLoading: isLoadingAmendments } = useGetAmendmentsQuery({ proposalId });
    const [changeProposalStatus, { isLoading: isChangingStatus }] = useChangeProposalStatusMutation();
    const [signProposal, { isLoading: isSigning }] = useSignProposalMutation();

    // Signature Modal State
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [signingProposalId, setSigningProposalId] = useState<string | null>(null);
    const clientSigCanvas = useRef<SignatureCanvas>(null);

    // Amendment proposals (proposals created by PM from approved amendments)
    const amendmentProposals = Array.isArray(data?.data?.amendmentProposals)
        ? data.data.amendmentProposals
        : [];

    // Amendment requests (client-submitted amendment requests)
    const amendmentRequests = Array.isArray(amendmentsData?.data)
        ? amendmentsData.data
        : [];

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getRequestStatusBadge = (status: string) => {
        const config: Record<string, { bg: string; text: string }> = {
            PENDING: { bg: "bg-yellow-100", text: "text-yellow-800" },
            UNDER_REVIEW: { bg: "bg-blue-100", text: "text-blue-800" },
            APPROVED: { bg: "bg-green-100", text: "text-green-800" },
            REJECTED: { bg: "bg-red-100", text: "text-red-800" },
            COMPLETED: { bg: "bg-emerald-100", text: "text-emerald-800" },
        };
        const c = config[status] || { bg: "bg-gray-100", text: "text-gray-800" };
        return (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.bg} ${c.text}`}>
                {status.replace("_", " ")}
            </span>
        );
    };

    const getUrgencyBadge = (urgency: string) => {
        const config: Record<string, { bg: string; text: string }> = {
            LOW: { bg: "bg-gray-100", text: "text-gray-600" },
            MEDIUM: { bg: "bg-blue-100", text: "text-blue-700" },
            HIGH: { bg: "bg-orange-100", text: "text-orange-700" },
            URGENT: { bg: "bg-red-100", text: "text-red-700" },
        };
        const c = config[urgency] || { bg: "bg-gray-100", text: "text-gray-600" };
        return (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${c.bg} ${c.text}`}>
                {urgency}
            </span>
        );
    };

    const handleAcceptProposal = (id: string) => {
        setSigningProposalId(id);
        setIsSignatureModalOpen(true);
    };

    const handleConfirmSign = async () => {
        if (!signingProposalId || !clientSigCanvas.current) return;

        if (clientSigCanvas.current.isEmpty()) {
            toast.error("Please provide your signature.");
            return;
        }

        const signature = clientSigCanvas.current.toDataURL("image/png");

        try {
            await signProposal({
                id: signingProposalId,
                signature,
                type: 'owner'
            }).unwrap();

            toast.success("Amendment proposal signed and accepted!");
            setIsSignatureModalOpen(false);
            setSigningProposalId(null);
        } catch (error: any) {
            console.error("Failed to sign proposal:", error);
            toast.error(error?.data?.message || "Failed to sign proposal.");
        }
    };

    const handleRejectProposal = async (id: string) => {
        try {
            await changeProposalStatus({ id, status: "REJECTED" }).unwrap();
            toast.success("Proposal rejected.");
        } catch (error) {
            console.error("Failed to reject proposal:", error);
            toast.error("Failed to reject proposal.");
        }
    };

    const allLoading = isLoading || isLoadingAmendments;

    return (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white px-6 py-4 border-b flex items-center justify-between z-10">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">Amendments & Proposals</h3>
                        <p className="text-sm text-gray-500 mt-1">Your amendment requests and related proposals.</p>
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
                    {allLoading ? (
                        <div className="text-center text-gray-500 py-8">Loading...</div>
                    ) : (
                        <>
                            {/* ─── Amendment Requests Section ─── */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                    Amendment Requests ({amendmentRequests.length})
                                </h4>

                                {amendmentRequests.length === 0 ? (
                                    <div className="text-center text-gray-400 py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                        No amendment requests submitted yet.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {amendmentRequests.map((req: any) => (
                                            <div key={req.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow bg-white">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h5 className="font-semibold text-gray-900 text-sm">{req.projectName}</h5>
                                                            {getRequestStatusBadge(req.status)}
                                                            {getUrgencyBadge(req.urgency)}
                                                        </div>
                                                        <p className="text-sm text-gray-500 mt-1">{req.description}</p>
                                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                                            <span>Services: <span className="text-gray-600">{req.services}</span></span>
                                                            <span>Submitted: {formatDate(req.createdAt)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Review info if reviewed */}
                                                {req.reviewedBy && (
                                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                            <span>Reviewed by: <span className="font-medium text-gray-700">{req.reviewedBy.name}</span></span>
                                                            <span>•</span>
                                                            <span>{formatDate(req.reviewedAt)}</span>
                                                        </div>
                                                        {req.reviewNotes && (
                                                            <p className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                                                                <span className="font-medium">Notes:</span> {req.reviewNotes}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Linked amendment proposal */}
                                                {req.amendmentProposal && (
                                                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs">
                                                        <span className="text-gray-500">Linked Proposal:</span>
                                                        <span className="font-medium text-blue-600">{req.amendmentProposal.proposalNumber}</span>
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${req.amendmentProposal.status === "ACCEPTED" ? "bg-green-100 text-green-700" :
                                                            req.amendmentProposal.status === "SENT" ? "bg-blue-100 text-blue-700" :
                                                                "bg-gray-100 text-gray-600"
                                                            }`}>{req.amendmentProposal.status}</span>
                                                        {req.amendmentProposal.totalAmount && (
                                                            <span className="text-gray-600 font-medium">${req.amendmentProposal.totalAmount}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ─── Amendment Proposals Section ─── */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    Amendment Proposals ({amendmentProposals.length})
                                </h4>

                                {amendmentProposals.length === 0 ? (
                                    <div className="text-center text-gray-400 py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                        No amendment proposals created yet. Pending requests will be reviewed by the project manager.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {amendmentProposals.map((p: any) => (
                                            <div key={p.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">{p.title || p.projectName}</h4>
                                                        <p className="text-xs text-gray-400 mt-0.5">{p.proposalNumber}</p>
                                                        <p className="text-sm text-gray-500 mt-1">{p.projectDescription || "No description"}</p>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${p.status === "ACCEPTED" ? "bg-green-100 text-green-800" :
                                                        p.status === "SENT" ? "bg-blue-100 text-blue-800" :
                                                            p.status === "DRAFT" ? "bg-gray-100 text-gray-800" :
                                                                p.status === "REJECTED" ? "bg-red-100 text-red-800" :
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
                                                <div className="col-span-3 mt-3 pt-3 border-t border-gray-100">
                                                    <h5 className="text-xs font-semibold text-gray-700 uppercase mb-2">Included Services</h5>
                                                    {p.services && p.services.length > 0 ? (
                                                        <div className="space-y-1.5">
                                                            {p.services.map((s: any) => (
                                                                <div key={s.id} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                                                                    <div>
                                                                        <span className="font-medium text-gray-800">{s.name}</span>
                                                                        {s.description && <p className="text-gray-500 mt-0.5">{s.description}</p>}
                                                                    </div>
                                                                    <span className="text-gray-600 font-semibold">${s.amount}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-gray-400 italic">No services listed.</p>
                                                    )}
                                                </div>
                                                {/* Accept/Reject buttons for SENT or VIEWED amendment proposals */}
                                                {(p.status === "SENT" || p.status === "VIEWED") && (
                                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                                                        <button
                                                            onClick={() => handleAcceptProposal(p.id)}
                                                            disabled={isChangingStatus}
                                                            className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectProposal(p.id)}
                                                            disabled={isChangingStatus}
                                                            className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                        Close
                    </button>
                </div>

                {/* Client Signature Modal */}
                {isSignatureModalOpen && (
                    <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-[100] p-4">
                        <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full">
                            <div className="px-6 py-4 border-b">
                                <h3 className="text-lg font-semibold text-gray-800">Sign & Accept Amendment</h3>
                                <p className="text-sm text-gray-500 mt-1">By signing below, you agree to the terms of this amendment.</p>
                            </div>
                            <div className="p-6">
                                <div className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
                                    <SignatureCanvas
                                        ref={clientSigCanvas}
                                        canvasProps={{
                                            className: "w-full h-48 bg-white cursor-crosshair",
                                            width: 500,
                                            height: 200
                                        }}
                                    />
                                </div>
                                <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                                    <span>Sign above using your mouse or touch screen</span>
                                    <button
                                        onClick={() => clientSigCanvas.current?.clear()}
                                        className="text-blue-600 hover:underline cursor-pointer"
                                    >
                                        Clear Signature
                                    </button>
                                </div>
                                <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded text-xs text-blue-800 leading-relaxed">
                                    <strong>Agreement:</strong> I hereby accept this amendment proposal and any included services. The total amount will be updated in my project overview.
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
                                <button
                                    onClick={() => {
                                        setIsSignatureModalOpen(false);
                                        setSigningProposalId(null);
                                    }}
                                    disabled={isSigning}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmSign}
                                    disabled={isSigning}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSigning ? "Processing..." : "Sign & Accept Amendment"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};



/* ─── Status Badge ─── */

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
