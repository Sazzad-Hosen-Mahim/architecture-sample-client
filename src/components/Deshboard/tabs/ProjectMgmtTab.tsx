import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";
import {
    ProjectRequest,
    Proposal,
    ProposalService,
    useGetProposalsByProjectRequestQuery,
    useGetStagesByProposalQuery,
    useCompleteStageMutation,
    useUpdateStageMutation,
    useAddStageNoteMutation,
    useStartPhaseTimerMutation,
    useStopPhaseTimerMutation,
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
    MessageSquare,
    Plus,
    CalendarClock,
    Calendar,
    X,
    Play,
    Square,
    TrendingUp,
    Clock as ClockIcon,
    AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useGetAmendmentsByProjectQuery } from "@/redux/api/amendmentApi";

import { FinancialChart } from "@/components/Deshboard/Finacials/FinancialChart";

type ProjectMgmtTabProps = {
    project: ProjectRequest;
    readOnly?: boolean;
};

const canManageDeadlines = (role?: string) => {
    return role === "SUPER_ADMIN" || role === "ADMIN" || role === "PROJECT_MANAGER";
};

const formatDeadlineDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

const getDaysUntil = (dateStr: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const deadline = new Date(dateStr);
    deadline.setHours(0, 0, 0, 0);
    const diff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
};

const getDeadlineColor = (dateStr: string | null | undefined) => {
    if (!dateStr) return "";
    const days = getDaysUntil(dateStr);
    if (days < 0) return "text-red-600 bg-red-50 border-red-200";
    if (days <= 1) return "text-red-600 bg-red-50 border-red-200";
    if (days <= 3) return "text-amber-600 bg-amber-50 border-amber-200";
    if (days <= 7) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
};

// Helper to format seconds to HH:MM:SS
const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

// Subcomponent for the per-phase timer
function PhaseTimer({ stage, readOnly }: { stage: any; readOnly?: boolean }) {
    const [startTimer] = useStartPhaseTimerMutation();
    const [stopTimer] = useStopPhaseTimerMutation();
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        let interval: any;
        if (stage.activeTimerStart) {
            const start = new Date(stage.activeTimerStart).getTime();
            interval = setInterval(() => {
                const now = new Date().getTime();
                const diff = Math.floor((now - start) / 1000);
                setElapsed((stage.accumulatedTime || 0) + diff);
            }, 1000);
        } else {
            setElapsed(stage.accumulatedTime || 0);
        }
        return () => clearInterval(interval);
    }, [stage.activeTimerStart, stage.accumulatedTime]);

    const handleToggleTimer = async () => {
        try {
            if (stage.activeTimerStart) {
                await stopTimer(stage.id).unwrap();
                toast.success("Timer stopped. Time saved.");
            } else {
                await startTimer(stage.id).unwrap();
                toast.success("Timer started!");
            }
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to toggle timer");
        }
    };

    const isActive = !!stage.activeTimerStart;

    return (
        <div className="flex flex-col items-end gap-1">
            <div className={`text-[10px] font-black tracking-widest uppercase ${isActive ? "text-green-600 animate-pulse" : "text-gray-400"}`}>
                {isActive ? "Timer Running" : "Final Duration"}
            </div>
            <div className="flex items-center gap-3">
                <div className={`font-mono text-sm font-bold bg-gray-50 px-2 py-1 rounded border ${isActive ? "border-green-200 text-green-700" : "border-gray-100 text-gray-500"}`}>
                    {formatDuration(elapsed)}
                </div>
                {!readOnly && (
                    <button
                        onClick={handleToggleTimer}
                        className={`p-2 rounded-full transition-all shadow-sm ${isActive
                            ? "bg-red-500 text-white hover:bg-red-600 active:scale-95"
                            : "bg-black text-white hover:bg-gray-800 active:scale-95"}`}
                        title={isActive ? "Stop Phase" : "Start Phase"}
                    >
                        {isActive ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>
                )}
            </div>
        </div>
    );
}

// Subcomponent for rendering stages of a single proposal
function ProposalStages({ proposal, readOnly }: { proposal: Proposal; readOnly?: boolean }) {
    const currentUser = useSelector(selectCurrentUser);
    const { data: stagesData, isLoading: stagesLoading } = useGetStagesByProposalQuery(proposal.id);
    const [completeStage, { isLoading: isCompleting }] = useCompleteStageMutation();
    const [updateStage, { isLoading: isUpdating }] = useUpdateStageMutation();
    const [addStageNote, { isLoading: isAddingNote }] = useAddStageNoteMutation();

    const [selectedStages, setSelectedStages] = useState<Set<string>>(new Set());
    const [driveLinkInputs, setDriveLinkInputs] = useState<Record<string, string>>({});
    const [showDriveLinkInput, setShowDriveLinkInput] = useState<Record<string, boolean>>({});
    const [editingDriveLink, setEditingDriveLink] = useState<Record<string, boolean>>({});
    const [showNotesInput, setShowNotesInput] = useState<Record<string, boolean>>({});
    const [newNoteInputs, setNewNoteInputs] = useState<Record<string, string>>({});

    // Deadline state
    const [showDeadlineInput, setShowDeadlineInput] = useState<Record<string, "internal" | "external" | null>>({});
    const [deadlineDateInputs, setDeadlineDateInputs] = useState<Record<string, string>>({});

    const userCanManageDeadlines = canManageDeadlines(currentUser?.role);

    const handleAddInternalNote = async (stageId: string) => {
        const note = newNoteInputs[stageId]?.trim();
        if (!note) {
            toast.error("Please enter a note");
            return;
        }

        try {
            await addStageNote({ id: stageId, notes: note }).unwrap();
            toast.success("Internal note added!");
            setShowNotesInput((prev) => ({ ...prev, [stageId]: false }));
            setNewNoteInputs((prev) => ({ ...prev, [stageId]: "" }));
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to add internal note");
        }
    };

    const toggleStageSelection = (stageId: string) => {
        const newSet = new Set(selectedStages);
        if (newSet.has(stageId)) {
            newSet.delete(stageId);
        } else {
            newSet.add(stageId);
        }
        setSelectedStages(newSet);
    };

    const handleCompleteSelected = async () => {
        if (selectedStages.size === 0) {
            toast.error("Please select at least one stage");
            return;
        }

        try {
            await Promise.all(
                Array.from(selectedStages).map((id) => completeStage({ id, notes: "Phase marked as completed." }).unwrap())
            );
            toast.success("Selected stages marked as completed!");
            setSelectedStages(new Set());
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to complete some stages");
        }
    };

    const handleSaveDriveLink = async (stageId: string) => {
        const link = driveLinkInputs[stageId]?.trim();
        if (!link) {
            toast.error("Please enter a Google Drive link");
            return;
        }

        try {
            await updateStage({ id: stageId, driveLink: link }).unwrap();
            toast.success("Google Drive link saved!");
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

    // Deadline handlers
    const handleSetDeadline = async (stageId: string, type: "internal" | "external") => {
        const dateValue = deadlineDateInputs[`${stageId}_${type}`];
        if (!dateValue) {
            toast.error("Please select a date");
            return;
        }

        try {
            const payload: any = { id: stageId };
            if (type === "internal") {
                payload.internalDeadline = new Date(dateValue).toISOString();
            } else {
                payload.externalDeadline = new Date(dateValue).toISOString();
            }
            await updateStage(payload).unwrap();
            toast.success(`${type === "internal" ? "Internal" : "External"} deadline set!`);
            setShowDeadlineInput((prev) => ({ ...prev, [stageId]: null }));
            setDeadlineDateInputs((prev) => ({ ...prev, [`${stageId}_${type}`]: "" }));
        } catch (error: any) {
            toast.error(error?.data?.message || `Failed to set ${type} deadline`);
        }
    };

    const handleRemoveDeadline = async (stageId: string, type: "internal" | "external") => {
        try {
            const payload: any = { id: stageId };
            if (type === "internal") {
                payload.internalDeadline = null;
            } else {
                payload.externalDeadline = null;
            }
            await updateStage(payload).unwrap();
            toast.success(`${type === "internal" ? "Internal" : "External"} deadline removed!`);
        } catch (error: any) {
            toast.error(error?.data?.message || `Failed to remove ${type} deadline`);
        }
    };

    if (stagesLoading) {
        return (
            <div className="py-4 flex justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
        );
    }

    const stages = stagesData || [];
    // If no stages exist, we show services from proposal as potential phases
    const hasStages = stages.length > 0;

    return (
        <div className="space-y-3">
            {hasStages ? (
                // Show actual project stages
                stages.map((stage: any) => {
                    const isCompleted = stage.status === "COMPLETED";
                    const isSelected = selectedStages.has(stage.id);
                    const showLink = showDriveLinkInput[stage.id];
                    const isEditing = editingDriveLink[stage.id];
                    const activeDeadlineInput = showDeadlineInput[stage.id];

                    return (
                        <div
                            key={stage.id}
                            className={`border rounded-lg p-4 transition-all ${isCompleted
                                ? "border-green-200 bg-green-50/50"
                                : isSelected
                                    ? "border-blue-300 bg-blue-50/50"
                                    : "border-gray-200 bg-white shadow-sm hover:shadow-md"
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
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h5
                                                className={`text-sm font-bold ${isCompleted ? "text-green-700 line-through" : "text-gray-900"
                                                    }`}
                                            >
                                                {stage.name}
                                            </h5>
                                            {isCompleted && (
                                                <span className="text-[10px] font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                                                    Completed
                                                </span>
                                            )}

                                            {/* Deadline badges */}
                                            {stage.internalDeadline && userCanManageDeadlines && (
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${getDeadlineColor(stage.internalDeadline)}`}>
                                                    <CalendarClock className="w-3 h-3" />
                                                    Internal: {formatDeadlineDate(stage.internalDeadline)}
                                                    {getDaysUntil(stage.internalDeadline) < 0 && " (Overdue)"}
                                                </span>
                                            )}
                                            {stage.externalDeadline && (
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${getDeadlineColor(stage.externalDeadline)}`}>
                                                    <Calendar className="w-3 h-3" />
                                                    External: {formatDeadlineDate(stage.externalDeadline)}
                                                    {getDaysUntil(stage.externalDeadline) < 0 && " (Overdue)"}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-8">
                                            {/* Task 2: Timer Integration */}
                                            {!isCompleted && (
                                                <PhaseTimer stage={stage} readOnly={readOnly} />
                                            )}

                                            {/* Deadline add buttons - only for authorized users */}
                                            {!readOnly && !isCompleted && userCanManageDeadlines && (
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    {!stage.internalDeadline && (
                                                        <button
                                                            onClick={() => setShowDeadlineInput((prev) => ({
                                                                ...prev,
                                                                [stage.id]: prev[stage.id] === "internal" ? null : "internal",
                                                            }))}
                                                            className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-2 py-1 rounded border transition-colors ${activeDeadlineInput === "internal"
                                                                ? "bg-orange-100 border-orange-300 text-orange-700"
                                                                : "bg-white border-gray-200 text-gray-500 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600"
                                                                }`}
                                                            title="Add Internal Deadline"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                            Internal
                                                        </button>
                                                    )}
                                                    {!stage.externalDeadline && (
                                                        <button
                                                            onClick={() => setShowDeadlineInput((prev) => ({
                                                                ...prev,
                                                                [stage.id]: prev[stage.id] === "external" ? null : "external",
                                                            }))}
                                                            className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-2 py-1 rounded border transition-colors ${activeDeadlineInput === "external"
                                                                ? "bg-blue-100 border-blue-300 text-blue-700"
                                                                : "bg-white border-gray-200 text-gray-500 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"
                                                                }`}
                                                            title="Add External Deadline"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                            External
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Deadline input */}
                                    {activeDeadlineInput && (
                                        <div className={`mt-2 flex items-center gap-2 p-2 rounded-md border ${activeDeadlineInput === "internal"
                                            ? "bg-orange-50/50 border-orange-200"
                                            : "bg-blue-50/50 border-blue-200"
                                            }`}>
                                            <span className={`text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap ${activeDeadlineInput === "internal" ? "text-orange-600" : "text-blue-600"
                                                }`}>
                                                {activeDeadlineInput === "internal" ? "Internal" : "External"} Deadline:
                                            </span>
                                            <input
                                                type="date"
                                                value={deadlineDateInputs[`${stage.id}_${activeDeadlineInput}`] || ""}
                                                onChange={(e) =>
                                                    setDeadlineDateInputs((prev) => ({
                                                        ...prev,
                                                        [`${stage.id}_${activeDeadlineInput}`]: e.target.value,
                                                    }))
                                                }
                                                min={new Date().toISOString().split("T")[0]}
                                                className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                            <button
                                                onClick={() => handleSetDeadline(stage.id, activeDeadlineInput)}
                                                disabled={isUpdating}
                                                className={`px-3 py-1 text-[10px] font-semibold text-white rounded transition-colors disabled:opacity-50 ${activeDeadlineInput === "internal"
                                                    ? "bg-orange-600 hover:bg-orange-700"
                                                    : "bg-blue-600 hover:bg-blue-700"
                                                    }`}
                                            >
                                                {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                                            </button>
                                            <button
                                                onClick={() => setShowDeadlineInput((prev) => ({ ...prev, [stage.id]: null }))}
                                                className="px-1 py-1 text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Existing deadline edit/remove options */}
                                    {!readOnly && !isCompleted && userCanManageDeadlines && (stage.internalDeadline || stage.externalDeadline) && (
                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                            {stage.internalDeadline && (
                                                <div className="inline-flex items-center gap-1">
                                                    <button
                                                        onClick={() => {
                                                            setDeadlineDateInputs((prev) => ({
                                                                ...prev,
                                                                [`${stage.id}_internal`]: new Date(stage.internalDeadline).toISOString().split("T")[0],
                                                            }));
                                                            setShowDeadlineInput((prev) => ({ ...prev, [stage.id]: "internal" }));
                                                        }}
                                                        className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded border border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
                                                    >
                                                        <Pencil className="w-2.5 h-2.5" />
                                                        Edit Internal
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveDeadline(stage.id, "internal")}
                                                        disabled={isUpdating}
                                                        className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                                                    >
                                                        <Trash2 className="w-2.5 h-2.5" />
                                                    </button>
                                                </div>
                                            )}
                                            {stage.externalDeadline && (
                                                <div className="inline-flex items-center gap-1">
                                                    <button
                                                        onClick={() => {
                                                            setDeadlineDateInputs((prev) => ({
                                                                ...prev,
                                                                [`${stage.id}_external`]: new Date(stage.externalDeadline).toISOString().split("T")[0],
                                                            }));
                                                            setShowDeadlineInput((prev) => ({ ...prev, [stage.id]: "external" }));
                                                        }}
                                                        className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                                    >
                                                        <Pencil className="w-2.5 h-2.5" />
                                                        Edit External
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveDeadline(stage.id, "external")}
                                                        disabled={isUpdating}
                                                        className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                                                    >
                                                        <Trash2 className="w-2.5 h-2.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {stage.description && (
                                        <p className="text-xs text-gray-500 mt-1">{stage.description}</p>
                                    )}

                                    {/* Show existing notes (visible to all PMs at any stage) */}
                                    {stage.notes && (
                                        <div className="mt-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                                            <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                <MessageSquare className="w-3 h-3" />
                                                Internal PM Feedback
                                            </p>
                                            <p className="text-xs text-amber-800 whitespace-pre-wrap">{stage.notes}</p>
                                        </div>
                                    )}

                                    {/* Add Internal Note capability */}
                                    {!readOnly && (
                                        <div className="mt-2">
                                            {showNotesInput[stage.id] ? (
                                                <div className="space-y-2 bg-blue-50/30 p-2 rounded-md border border-blue-100">
                                                    <textarea
                                                        value={newNoteInputs[stage.id] || ""}
                                                        onChange={(e) =>
                                                            setNewNoteInputs((prev) => ({ ...prev, [stage.id]: e.target.value }))
                                                        }
                                                        placeholder="Type additional notes here..."
                                                        className="w-full px-2.5 py-2 text-xs border border-blue-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white resize-none"
                                                        rows={3}
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleAddInternalNote(stage.id)}
                                                            disabled={isAddingNote}
                                                            className="px-3 py-1.5 text-[10px] font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                                                        >
                                                            {isAddingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageSquare className="w-3 h-3" />}
                                                            Post Internal Note
                                                        </button>
                                                        <button
                                                            onClick={() => setShowNotesInput(prev => ({ ...prev, [stage.id]: false }))}
                                                            className="px-3 py-1.5 text-[10px] font-medium text-gray-500 hover:text-gray-700 transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setShowNotesInput(prev => ({ ...prev, [stage.id]: true }))}
                                                    className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-all"
                                                >
                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                    {stage.notes ? "Add Another Note" : "Add Internal Note"}
                                                </button>
                                            )}
                                        </div>
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
                                                onClick={() => handleSaveDriveLink(stage.id)}
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
            ) : (proposal.services?.length || 0) > 0 ? (
                // Show services from proposal as phases (since no stages have been created yet)
                <div className="text-center py-4 text-sm text-gray-400 border border-dashed border-gray-200 rounded-lg">
                    <p className="mb-1">No project stages have been created yet.</p>
                    <p className="text-xs">Services from this proposal can be instantiated as project phases.</p>
                    <div className="mt-3 space-y-2">
                        {proposal.services?.map((service: ProposalService) => (
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
                        onClick={handleCompleteSelected}
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
    const currentUser = useSelector(selectCurrentUser);
    const { data: proposalsData, isLoading } = useGetProposalsByProjectRequestQuery(project.id);
    const { data: amendmentsData } = useGetAmendmentsByProjectQuery({ projectId: project.id });
    const [expandedProposals, setExpandedProposals] = useState<Set<string>>(new Set());

    const pendingAmendments = (amendmentsData?.data || []).filter((a: any) => a.status === "PENDING");

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
            {pendingAmendments.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-amber-900">Pending Amendment Requests</h4>
                            <p className="text-xs text-amber-700">
                                There are {pendingAmendments.length} amendment request{pendingAmendments.length > 1 ? 's' : ''} waiting for review.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            // Find the Tab buttons and click the Contracts one
                            const contractsTab = document.getElementById('contracts-tab');
                            if (contractsTab) contractsTab.click();
                        }}
                        className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition-all shadow-sm shadow-amber-600/20 active:scale-95 whitespace-nowrap"
                    >
                        Review Now
                    </button>
                </div>
            )}

            <div className="flex items-center justify-between bg-gray-50/50 p-4 rounded-xl border border-gray-100 mb-2">
                <p className="text-xs text-gray-500 max-w-md">
                    Manage project phases from signed contracts. Check phases and mark them as complete. Optionally add Google Drive links for client deliverables.
                </p>
                {project.isProjectStarted && project.projectStartedAt && (
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Project Active For</p>
                            <p className="text-lg font-mono font-bold text-black flex items-center gap-2">
                                <ClockIcon className="w-5 h-5 text-blue-600" />
                                {Math.floor((new Date().getTime() - new Date(project.projectStartedAt).getTime()) / (1000 * 60 * 60 * 24))} Days
                            </p>
                        </div>
                    </div>
                )}
            </div>

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

            {/* Project Financial Performance Chart - Only for Managers */}
            {(currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "ADMIN" || currentUser?.role === "PROJECT_MANAGER") && (
                <div className="mt-12 pt-8 border-t border-gray-100">
                    <div className="mb-6 px-2">
                        <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            Project Financial Analytics
                        </h3>
                        <p className="text-xs text-gray-500 font-medium">Real-time revenue, labor costs, and profit trends for this project</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <FinancialChart projectId={project.id} />
                    </div>
                </div>
            )}
        </div>
    );
}
