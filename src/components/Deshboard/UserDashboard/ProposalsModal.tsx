import {
    useChangeProposalStatusMutation,
    useGetMyProjectRequestsQuery,
    useSignProposalMutation
} from "@/redux/api/adminDashboard/proposalApi";
import {
    useCreateAmendmentMutation,
    AmendmentUrgency,
} from "@/redux/api/amendmentApi";
import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle2, XCircle, MoreVertical, Eye, FileEdit, FileStack, FileSignature, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ContractReviewModal from '@/components/Deshboard/ContractReviewModal';
import ViewProposalDetailsModal from '@/components/Modal/ViewProposalDetailsModal';

const ProposalStatusBadge = ({ status }: { status: string }) => {
    const configs: Record<string, { label: string, style: string }> = {
        ACCEPTED: { label: "Accepted", style: "bg-green-100 text-green-700 border-green-200" },
        REJECTED: { label: "Rejected", style: "bg-red-100 text-red-700 border-red-200" },
        SENT: { label: "Sent", style: "bg-blue-100 text-blue-700 border-blue-200" },
        VIEWED: { label: "Viewed", style: "bg-purple-100 text-purple-700 border-purple-200" },
        DRAFT: { label: "Draft", style: "bg-gray-100 text-gray-700 border-gray-200" },
    };

    const config = configs[status] || { label: status, style: "bg-gray-100 text-gray-700 border-gray-200" };

    return (
        <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 ${config.style} uppercase`}>
            {config.label}
        </Badge>
    );
};

// This component replaces the old ProposalsTab functionality within the Projects view context.
interface ProposalsModalProps {
    isOpen: boolean;
    onClose: () => void;
    proposals: any[]; // Changed to any to match expected properties from API response
    projectName: string;
}

const ProposalsModal = ({ isOpen, onClose, proposals, projectName }: ProposalsModalProps) => {
    const { refetch: refetchProjects } = useGetMyProjectRequestsQuery();
    const [changeProposalStatus, { isLoading: isUpdating }] = useChangeProposalStatusMutation();
    const [createAmendment, { isLoading: isCreatingAmendment }] = useCreateAmendmentMutation();

    // Internal modal states
    const [selectedProposal, setSelectedProposal] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isContractModalOpen, setIsContractModalOpen] = useState(false);
    const [contractProposalId, setContractProposalId] = useState<string>("");
    const [isAmendmentModalOpen, setIsAmendmentModalOpen] = useState(false);
    const [amendmentProposalId, setAmendmentProposalId] = useState<string>("");
    const [amendmentForm, setAmendmentForm] = useState({
        projectName: "",
        description: "",
        services: "",
        urgency: "MEDIUM" as AmendmentUrgency,
    });
    const [isAmendmentProposalsOpen, setIsAmendmentProposalsOpen] = useState(false);
    const [viewAmendmentProposalId, setViewAmendmentProposalId] = useState<string>("");
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    const handleAccept = async (proposal: any) => {
        setOpenDropdownId(null);

        // Ensure user reads contract before accepting
        const hasAContract = (proposal.contractSections && proposal.contractSections.length > 0) || proposal.masterContractId;

        if (!proposal.clientContractSignature && hasAContract) {
            toast.info("Please review and sign the contract before accepting this proposal.");
            setContractProposalId(proposal.id);
            setIsContractModalOpen(true);
            return;
        }

        try {
            await changeProposalStatus({ id: proposal.id, status: "ACCEPTED" }).unwrap();
            toast.success("Proposal accepted successfully!");
            refetchProjects();
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to accept proposal");
        }
    };

    const handleReject = async (proposalId: string) => {
        setOpenDropdownId(null);
        try {
            await changeProposalStatus({ id: proposalId, status: "REJECTED" }).unwrap();
            toast.success("Proposal rejected.");
            refetchProjects();
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to reject proposal");
        }
    };

    const handleViewDetails = (proposal: any) => {
        setOpenDropdownId(null);
        setSelectedProposal(proposal);
        setIsDetailsOpen(true);
    };

    const handleOpenContract = (proposalId: string) => {
        setOpenDropdownId(null);
        setContractProposalId(proposalId);
        setIsContractModalOpen(true);
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
            toast.error("Failed to submit amendment.");
        }
    };

    const handleViewAmendmentProposals = (proposalId: string) => {
        setOpenDropdownId(null);
        setViewAmendmentProposalId(proposalId);
        setIsAmendmentProposalsOpen(true);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "ACCEPTED": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case "REJECTED": return <XCircle className="w-4 h-4 text-red-500" />;
            case "SENT": return <Clock className="w-4 h-4 text-blue-500" />;
            default: return <FileText className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <FileText className="w-6 h-6 text-blue-600" />
                                Proposals for {projectName}
                            </div>
                        </DialogTitle>
                        <DialogDescription>
                            Review and take action on proposals related to this project.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 space-y-4">
                        {proposals.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                                No proposals found for this project.
                            </div>
                        ) : (
                            proposals.map((proposal) => (
                                <div
                                    key={proposal.id}
                                    className="group relative p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/10 transition-all shadow-sm"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-lg border border-gray-100 group-hover:border-blue-200">
                                                {getStatusIcon(proposal.status)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 leading-tight">
                                                    {proposal.title || `Proposal ${proposal.proposalNumber}`}
                                                </div>
                                                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-1">
                                                    #{proposal.proposalNumber} • {new Date(proposal.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ProposalStatusBadge status={proposal.status} />

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
                                    </div>
                                    <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-gray-100">
                                        <div className="flex items-center gap-4">
                                            <span className="text-gray-500">Amount: <span className="font-bold text-gray-900">${parseFloat(proposal.totalAmount || "0").toLocaleString()}</span></span>
                                        </div>
                                        {proposal.respondedAt && (
                                            <span className="text-gray-400">Responded: {new Date(proposal.respondedAt).toLocaleDateString()}</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Button variant="outline" onClick={onClose} className="rounded-lg">
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Sub-modals rendered outside main dialog to avoid UI constraints */}
            {isDetailsOpen && selectedProposal && (
                <ViewProposalDetailsModal
                    proposal={selectedProposal}
                    onClose={() => {
                        setIsDetailsOpen(false);
                        setSelectedProposal(null);
                    }}
                />
            )}

            {isAmendmentModalOpen && (
                <CreateAmendmentModal
                    isLoading={isCreatingAmendment}
                    form={amendmentForm}
                    onChange={(field: string, value: any) => setAmendmentForm(prev => ({ ...prev, [field]: value }))}
                    onSubmit={handleSubmitAmendment}
                    onClose={() => setIsAmendmentModalOpen(false)}
                />
            )}

            {isAmendmentProposalsOpen && viewAmendmentProposalId && (
                <AmendmentProposalsModal
                    proposalId={viewAmendmentProposalId}
                    onClose={() => {
                        setIsAmendmentProposalsOpen(false);
                        setViewAmendmentProposalId("");
                    }}
                />
            )}

            <ContractReviewModal
                isOpen={isContractModalOpen}
                onClose={() => setIsContractModalOpen(false)}
                proposalId={contractProposalId}
                onContractSigned={async () => {
                    // Automatically accept the proposal once the contract is signed
                    try {
                        await changeProposalStatus({ id: contractProposalId, status: "ACCEPTED" }).unwrap();
                        toast.success("Contract signed and proposal accepted!");
                        refetchProjects();
                    } catch (error) {
                        console.error("Failed to auto-accept proposal after signing:", error);
                        // Still refetch so the signature shows up
                        refetchProjects();
                    }
                }}
            />
        </>
    );
};

/* ─── Shared Sub-components re-integrated from ProposalsTab ─── */

import {
    useGetAllProposalsForProposalQuery,
    useGetAmendmentsQuery,
} from "@/redux/api/amendmentApi";
import SignatureCanvas from 'react-signature-canvas';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle();
                }}
                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                title="Actions"
            >
                <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>

            {isOpen && (
                <div className="absolute right-0 w-52 bg-white rounded-lg shadow-xl border border-gray-100 z-[100] py-1 animate-in fade-in-0 mt-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); onView(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <Eye className="w-4 h-4 text-blue-500" />
                        View Details
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onAmendment(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <FileEdit className="w-4 h-4 text-indigo-500" />
                        Request Amendment
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onProposals(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <FileStack className="w-4 h-4 text-teal-500" />
                        View Proposals
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onContract(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <FileSignature className="w-4 h-4 text-amber-500" />
                        View Contract
                    </button>
                    {canAcceptReject && (
                        <>
                            <div className="border-t border-gray-100 my-1" />
                            <button
                                onClick={(e) => { e.stopPropagation(); onAccept(); }}
                                disabled={isUpdating}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                Accept Proposal
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onReject(); }}
                                disabled={isUpdating}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
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

const CreateAmendmentModal = ({ isLoading, form, onChange, onSubmit, onClose }: any) => {
    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg bg-white overflow-hidden p-0 border-none shadow-2xl">
                <DialogHeader className="px-6 py-5 border-b bg-gray-50/50">
                    <DialogTitle className="text-lg font-bold text-gray-900">Request Amendment</DialogTitle>
                    <DialogDescription className="text-xs text-gray-500 mt-1">Submit your requested changes for this proposal.</DialogDescription>
                </DialogHeader>
                <div className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Project Name</label>
                        <input
                            type="text"
                            value={form.projectName}
                            onChange={(e) => onChange("projectName", e.target.value)}
                            placeholder="e.g. Additional Garage Extension"
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => onChange("description", e.target.value)}
                            placeholder="Describe the amendment you need..."
                            rows={3}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Services</label>
                        <textarea
                            value={form.services}
                            onChange={(e) => onChange("services", e.target.value)}
                            placeholder="Required services..."
                            rows={2}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Urgency</label>
                        <select
                            value={form.urgency}
                            onChange={(e) => onChange("urgency", e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                        </select>
                    </div>
                </div>
                <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={isLoading} className="rounded-lg">Cancel</Button>
                    <Button onClick={onSubmit} disabled={isLoading} className="rounded-lg bg-blue-600 hover:bg-blue-700">{isLoading ? "Submitting..." : "Submit Request"}</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const AmendmentProposalsModal = ({ proposalId, onClose }: any) => {
    const { data: proposals } = useGetAllProposalsForProposalQuery(proposalId);
    const { data: amendmentsData } = useGetAmendmentsQuery({ proposalId });
    const [signProposal] = useSignProposalMutation();
    const [changeProposalStatus] = useChangeProposalStatusMutation();

    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [signingId, setSigningId] = useState<string | null>(null);
    const sigCanvas = useRef<SignatureCanvas>(null);

    const amdProposals = proposals?.data?.amendmentProposals || [];
    const amdRequests = amendmentsData?.data || [];

    const handleAccept = (id: string) => {
        setSigningId(id);
        setIsSignatureModalOpen(true);
    };

    const handleSign = async () => {
        if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
            toast.error("Please provide your signature");
            return;
        }
        // Ensure signingId exists before proceeding
        if (!signingId) {
            toast.error("No proposal selected for signing.");
            return;
        }
        try {
            await signProposal({ id: signingId as string, signature: sigCanvas.current.toDataURL(), type: 'owner' }).unwrap();
            toast.success("Proposal signed and accepted!");
            // Automatically call changeProposalStatus to 'ACCEPTED' upon successful contract signing.
            if (signingId) {
                await changeProposalStatus({ id: signingId, status: "ACCEPTED" });
            }
            setIsSignatureModalOpen(false);
        } catch (error) {
            toast.error("Failed to sign proposal");
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white p-0 border-none shadow-2xl">
                <DialogHeader className="sticky top-0 bg-white px-6 py-5 border-b z-10 shadow-sm flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle className="text-lg font-bold">Amendments & Related Proposals</DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">History of amendment requests and their corresponding proposals.</DialogDescription>
                    </div>
                </DialogHeader>
                <div className="p-6 space-y-6">
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Requests ({amdRequests.length})</h4>
                        <div className="space-y-3">
                            {amdRequests.map((req: any) => (
                                <div key={req.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                                    <div className="flex justify-between items-start">
                                        <h5 className="font-bold text-gray-900">{req.projectName}</h5>
                                        <Badge variant="outline" className="text-[10px] uppercase font-bold">{req.status}</Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2">{req.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Proposals ({amdProposals.length})</h4>
                        <div className="space-y-3">
                            {amdProposals.map((p: any) => (
                                <div key={p.id} className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h5 className="font-bold text-gray-900">{p.title || `Proposal ${p.proposalNumber}`}</h5>
                                            <div className="text-[10px] text-gray-400 mt-0.5">#{p.proposalNumber}</div>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] uppercase font-bold">{p.status}</Badge>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        {(p.status === "SENT" || p.status === "VIEWED") && (
                                            <>
                                                <Button size="sm" onClick={() => handleAccept(p.id)} className="h-8 bg-green-600 hover:bg-green-700 text-white">Accept</Button>
                                                <Button size="sm" variant="outline" onClick={() => changeProposalStatus({ id: p.id, status: "REJECTED" })} className="h-8 text-red-600 border-red-100 hover:bg-red-50">Reject</Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {isSignatureModalOpen && (
                    <Dialog open={true} onOpenChange={() => setIsSignatureModalOpen(false)}>
                        <DialogContent className="sm:max-w-md bg-white p-8 rounded-2xl shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold mb-4">Provide your signature</DialogTitle>
                            </DialogHeader>
                            <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-gray-50 mb-6">
                                <SignatureCanvas ref={sigCanvas} canvasProps={{ className: "w-full h-48 cursor-crosshair" }} />
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button variant="ghost" onClick={() => setIsSignatureModalOpen(false)}>Cancel</Button>
                                <Button onClick={() => sigCanvas.current?.clear()} variant="outline">Clear</Button>
                                <Button onClick={handleSign} className="bg-blue-600">Sign & Accept</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ProposalsModal;
