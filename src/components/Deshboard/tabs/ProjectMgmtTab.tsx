import { useState } from "react";
import {
    ProjectRequest,
    Proposal,
    useGetProposalsByProjectRequestQuery,
    useGetStagesByProposalQuery,
    useCompleteStageMutation,
    useUpdateStageMutation,
} from "@/redux/api/adminDashboard/proposalApi";
import {
    Loader2,
    CheckCircle2,
    Circle,
    ExternalLink,
    LinkIcon,
    ChevronDown,
    ChevronRight,
    FolderOpen,
    Pencil,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";

type ProjectMgmtTabProps = {
    project: ProjectRequest;
    readOnly?: boolean;
};

// Subcomponent for rendering stages of a single proposal
function ProposalStages({ proposal, readOnly }: { proposal: Proposal; readOnly?: boolean }) {
    const { data: stagesData, isLoading: stagesLoading } = useGetStagesByProposalQuery(proposal.id);
    const [completeStage, { isLoading: isCompleting }] = useCompleteStageMutation();
    const [updateStage, { isLoading: isUpdating }] = useUpdateStageMutation();

    const [selectedStages, setSelectedStages] = useState<Set<string>>(new Set());
    const [driveLinkInputs, setDriveLinkInputs] = useState<Record<string, string>>({});
    const [showDriveLinkInput, setShowDriveLinkInput] = useState<Record<string, boolean>>({});
    const [editingDriveLink, setEditingDriveLink] = useState<Record<string, boolean>>({});

    const stages: any[] = stagesData || [];

    const toggleStageSelection = (stageId: string) => {
        setSelectedStages((prev) => {
            const next = new Set(prev);
            if (next.has(stageId)) {
                next.delete(stageId);
            } else {
                next.add(stageId);
            }
            return next;
        });
    };

    const handleCompletePhase = async () => {
        if (selectedStages.size === 0) {
            toast.error("Please select at least one phase to complete");
            return;
        }

        try {
            const promises = Array.from(selectedStages).map((stageId) =>
                completeStage({ id: stageId, notes: "Phase completed by project manager" }).unwrap()
            );
            await Promise.all(promises);
            toast.success(`${selectedStages.size} phase(s) marked as completed!`);
            setSelectedStages(new Set());
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to complete phase(s)");
        }
    };

    const handleAddDriveLink = async (stageId: string) => {
        const link = driveLinkInputs[stageId]?.trim();
        if (!link) {
            toast.error("Please enter a Google Drive link");
            return;
        }

        try {
            await updateStage({ id: stageId, driveLink: link }).unwrap();
            toast.success("Google Drive link saved successfully!");
            setShowDriveLinkInput((prev) => ({ ...prev, [stageId]: false }));
            setEditingDriveLink((prev) => ({ ...prev, [stageId]: false }));
            setDriveLinkInputs((prev) => ({ ...prev, [stageId]: "" }));
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to save Google Drive link");
        }
    };

    const handleEditDriveLink = (stageId: string, currentLink: string) => {
        setDriveLinkInputs((prev) => ({ ...prev, [stageId]: currentLink }));
        setEditingDriveLink((prev) => ({ ...prev, [stageId]: true }));
        setShowDriveLinkInput((prev) => ({ ...prev, [stageId]: true }));
    };

    const handleDeleteDriveLink = async (stageId: string) => {
        try {
            await updateStage({ id: stageId, driveLink: "" }).unwrap();
            toast.success("Google Drive link removed!");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to remove Google Drive link");
        }
    };

    if (stagesLoading) {
        return (
            <div className="py-4 flex justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
        );
    }

    // If no stages exist, we show services from proposal as potential phases
    const hasStages = stages.length > 0;
    const services = proposal.services || [];

    return (
        <div className="space-y-3">
            {hasStages ? (
                // Show actual project stages
                stages.map((stage: any) => {
                    const isCompleted = stage.status === "COMPLETED";
                    const isSelected = selectedStages.has(stage.id);
                    const showLink = showDriveLinkInput[stage.id];
                    const isEditing = editingDriveLink[stage.id];

                    return (
                        <div
                            key={stage.id}
                            className={`border rounded-lg p-4 transition-all ${isCompleted
                                ? "border-green-200 bg-green-50/50"
                                : isSelected
                                    ? "border-blue-300 bg-blue-50/50"
                                    : "border-gray-200 bg-white"
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                {/* Checkbox */}
                                <button
                                    onClick={() => !isCompleted && !readOnly && toggleStageSelection(stage.id)}
                                    disabled={isCompleted || readOnly}
                                    className={`mt-0.5 flex-shrink-0 ${readOnly ? "cursor-default" : ""}`}
                                >
                                    {isCompleted ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    ) : isSelected ? (
                                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                                    ) : (
                                        <Circle className={`w-5 h-5 text-gray-300 ${!readOnly ? "hover:text-gray-400" : ""}`} />
                                    )}
                                </button>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h5
                                            className={`text-sm font-medium ${isCompleted ? "text-green-700 line-through" : "text-gray-900"
                                                }`}
                                        >
                                            {stage.name}
                                        </h5>
                                        {isCompleted && (
                                            <span className="text-[10px] font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                                                Completed
                                            </span>
                                        )}
                                    </div>

                                    {stage.description && (
                                        <p className="text-xs text-gray-500 mt-1">{stage.description}</p>
                                    )}

                                    {/* Progress bar */}
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
                                            <div
                                                className={`h-1.5 rounded-full transition-all ${isCompleted ? "bg-green-500" : "bg-blue-500"
                                                    }`}
                                                style={{ width: `${stage.progress || 0}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] text-gray-400">{stage.progress || 0}%</span>
                                    </div>

                                    {/* Drive Link - display with edit/delete */}
                                    {stage.driveLink && !isEditing && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <a
                                                href={stage.driveLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium truncate"
                                            >
                                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                                View Deliverables on Google Drive
                                            </a>
                                            {!readOnly && (
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <button
                                                        onClick={() => handleEditDriveLink(stage.id, stage.driveLink)}
                                                        className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                                                    >
                                                        <Pencil className="w-2.5 h-2.5" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteDriveLink(stage.id)}
                                                        disabled={isUpdating}
                                                        className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                                                    >
                                                        <Trash2 className="w-2.5 h-2.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Drive Link Input - Add new */}
                                    {!stage.driveLink && !showLink && !readOnly && (
                                        <button
                                            onClick={() =>
                                                setShowDriveLinkInput((prev) => ({ ...prev, [stage.id]: true }))
                                            }
                                            className="inline-flex items-center gap-1 mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            <LinkIcon className="w-3 h-3" />
                                            Add Google Drive Link
                                        </button>
                                    )}

                                    {showLink && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <input
                                                type="url"
                                                value={driveLinkInputs[stage.id] || ""}
                                                onChange={(e) =>
                                                    setDriveLinkInputs((prev) => ({ ...prev, [stage.id]: e.target.value }))
                                                }
                                                placeholder="https://drive.google.com/..."
                                                className="flex-1 px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                            <button
                                                onClick={() => handleAddDriveLink(stage.id)}
                                                disabled={isUpdating}
                                                className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowDriveLinkInput((prev) => ({ ...prev, [stage.id]: false }));
                                                    setEditingDriveLink((prev) => ({ ...prev, [stage.id]: false }));
                                                }}
                                                className="px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })
            ) : services.length > 0 ? (
                // Show services from proposal as phases (since no stages have been created yet)
                <div className="text-center py-4 text-sm text-gray-400 border border-dashed border-gray-200 rounded-lg">
                    <p className="mb-1">No project stages have been created yet.</p>
                    <p className="text-xs">Services from this proposal can be instantiated as project phases.</p>
                    <div className="mt-3 space-y-2">
                        {services.map((service) => (
                            <div key={service.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded text-left mx-4">
                                <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                <span className="text-xs text-gray-600">{service.name}</span>
                                <span className="text-xs text-gray-400 ml-auto">${Number(service.amount || 0).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-4 text-sm text-gray-400">
                    No services or stages available.
                </div>
            )}

            {/* Complete Phase button */}
            {!readOnly && hasStages && selectedStages.size > 0 && (
                <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                        onClick={handleCompletePhase}
                        disabled={isCompleting}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                    >
                        {isCompleting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Completing...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                Complete Phase ({selectedStages.size})
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}

export default function ProjectMgmtTab({ project, readOnly }: ProjectMgmtTabProps) {
    const { data: proposalsData, isLoading } = useGetProposalsByProjectRequestQuery(project.id);
    const [expandedProposals, setExpandedProposals] = useState<Set<string>>(new Set());

    const allProposals: Proposal[] = proposalsData?.data || [];

    // Only show accepted proposals + accepted amendments for project management
    const acceptedProposals = allProposals.filter((p) => p.status === "ACCEPTED");

    const toggleProposal = (proposalId: string) => {
        setExpandedProposals((prev) => {
            const next = new Set(prev);
            if (next.has(proposalId)) {
                next.delete(proposalId);
            } else {
                next.add(proposalId);
            }
            return next;
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
                <span className="text-gray-500 text-sm">Loading project phases...</span>
            </div>
        );
    }

    if (acceptedProposals.length === 0) {
        return (
            <div className="text-center py-16 space-y-3 border border-dashed border-gray-200 rounded-xl">
                <FolderOpen className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="text-gray-500 text-sm">No accepted contracts found.</p>
                <p className="text-xs text-gray-400">
                    Project management will be available once a contract is signed.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <p className="text-xs text-gray-500">
                Manage project phases from signed contracts. Check phases and mark them as complete. Optionally add Google Drive links for client deliverables.
            </p>

            {acceptedProposals.map((proposal) => {
                const isExpanded = expandedProposals.has(proposal.id);
                const isAmendment = proposal.proposalType === "AMENDMENT";

                return (
                    <div
                        key={proposal.id}
                        className={`border rounded-xl overflow-hidden ${isAmendment ? "border-purple-200" : "border-gray-200"
                            }`}
                    >
                        {/* Proposal Header */}
                        <button
                            onClick={() => toggleProposal(proposal.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isAmendment
                                ? "bg-purple-50 hover:bg-purple-100"
                                : "bg-gray-50 hover:bg-gray-100"
                                }`}
                        >
                            {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            )}

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-900 truncate">
                                        {proposal.title || proposal.projectName}
                                    </span>
                                    {isAmendment && (
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                                            Amendment
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-gray-400 font-mono">{proposal.proposalNumber}</span>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-xs text-gray-500 font-medium">
                                    {proposal.services?.length || 0} services
                                </span>
                                <span className="text-xs text-green-600 font-medium">
                                    ${Number(proposal.totalAmount || 0).toLocaleString()}
                                </span>
                            </div>
                        </button>

                        {/* Expanded: Stages */}
                        {isExpanded && (
                            <div className="px-4 py-4 border-t border-gray-100">
                                <ProposalStages proposal={proposal} readOnly={readOnly} />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
