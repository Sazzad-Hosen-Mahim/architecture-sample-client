import { useState } from "react";
import {
    ExternalLink,
    Link as LinkIcon,
    FolderOpen,
    Lock,
    Plus,
    Pencil,
    Trash2,
    Loader2,
} from "lucide-react";
import {
    useCreateAttachmentMutation,
    useUpdateAttachmentMutation,
    useDeleteAttachmentMutation,
    type ProjectAttachment,
} from "@/redux/api/adminDashboard/attachmentApi";
import { isLumpSum } from "@/utils/paymentPlan";
import { toExternalUrl } from "@/utils/externalUrl";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppSelector } from "@/hooks/useRedux";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";

interface StagePaymentInfo {
    stageId: string;
    stageName: string;
    amount: number;
    paid: boolean;
    /** The PM has marked this phase complete. */
    completed?: boolean;
    canPay: boolean;
    /** Paid *and* completed — the server applies the same rule to the URL. */
    canViewFiles: boolean;
}

interface ClientAttachmentsTabProps {
    project: any;
    attachments: ProjectAttachment[] | undefined;
    /** Payment status for this project, from GET /payments/status/:id. */
    paymentInfo?: {
        paymentMethod?: string | null;
        lumpSumPaid?: boolean;
        consultationPaid?: boolean;
        stages?: StagePaymentInfo[];
    };
    /** Sends the client to the tab where they can settle the outstanding phase. */
    onGoToPayments?: () => void;
}

/**
 * The client's intake uploads are read-only here — they were submitted with the
 * original project request.
 *
 * "Project Documents" is the shared folder for links the PM shares and the
 * documents the architect asks the client to provide. It unlocks — for viewing,
 * downloading AND adding documents — once the consultation fee is paid, the same
 * gate the meetings tab uses. Clients may add documents and manage the ones they
 * added; PM-added rows are read-only to them.
 *
 * Final deliverables are published per phase, and a phase's folder opens only
 * when it has been both paid for and completed by the PM.
 */
export default function ClientAttachmentsTab({
    project,
    attachments,
    paymentInfo,
    onGoToPayments,
}: ClientAttachmentsTabProps) {
    const stages = project.stages || [];
    const myId = useAppSelector(selectCurrentUser)?.id;

    // Mirrors the meetings tab: default to unlocked when payment status hasn't
    // loaded yet — a lock that flashes at a client who already paid is worse
    // than a moment of nothing, and the server rejects the request either way.
    const consultationPaid = paymentInfo
        ? (paymentInfo.consultationPaid ?? !!project.consultationPaymentId)
        : true;

    const [createAttachment, { isLoading: isCreating }] =
        useCreateAttachmentMutation();
    const [updateAttachment, { isLoading: isUpdating }] =
        useUpdateAttachmentMutation();
    const [deleteAttachment, { isLoading: isDeleting }] =
        useDeleteAttachmentMutation();

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<ProjectAttachment | null>(null);
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<ProjectAttachment | null>(
        null,
    );

    const openAdd = () => {
        setEditing(null);
        setTitle("");
        setUrl("");
        setModalOpen(true);
    };

    const openEdit = (a: ProjectAttachment) => {
        setEditing(a);
        setTitle(a.title);
        setUrl(a.url);
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!title.trim() || !url.trim()) {
            toast.error("Please provide both a title and a link");
            return;
        }
        try {
            if (editing) {
                await updateAttachment({
                    attachmentId: editing.id,
                    title,
                    url,
                }).unwrap();
                toast.success("Document updated");
            } else {
                await createAttachment({
                    projectRequestId: project.id,
                    title,
                    url,
                }).unwrap();
                toast.success("Document added");
            }
            setModalOpen(false);
            setEditing(null);
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to save document");
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteAttachment(deleteTarget.id).unwrap();
            toast.success("Document deleted");
            setDeleteTarget(null);
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to delete document");
        }
    };

    const lumpSum = isLumpSum({ paymentMethod: paymentInfo?.paymentMethod });
    const paymentByStageId = new Map(
        (paymentInfo?.stages || []).map((s) => [s.stageId, s]),
    );

    const intakeFiles: { label: string; value: string | null }[] = [
        { label: "Property Boundary/Survey Map", value: null },
        { label: "Geotechnical Report/Survey", value: null },
    ];

    const docs = attachments || [];

    const PhaseDeliverable = ({ stage, index }: { stage: any; index: number }) => {
        const payment = paymentByStageId.get(stage.id);
        const deliverablesUrl = toExternalUrl(stage.driveLink);

        // A folder needs both halves: the phase paid for AND finished by the
        // PM. `canViewFiles` already carries both, and the server strips the
        // URL under the same rule — requiring both here keeps the button from
        // opening on a stale link if the two ever disagree.
        const paid = payment?.paid ?? false;
        const completed =
            payment?.completed ?? stage.status === "COMPLETED";
        const canView = payment?.canViewFiles ?? (paid && completed);
        const unlocked = !!deliverablesUrl && canView;

        const lockReason = !paid
            ? lumpSum
                ? "Unlocks for every completed phase once the project payment is complete."
                : `Unlocks once the ${stage.name} payment is complete.`
            : !completed
                ? "Unlocks once your project manager completes this phase."
                : "Your project manager has not published this phase's deliverables yet.";

        return (
            <div className="border border-gray-200 rounded-xl p-4 bg-white">
                <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                            <span className="text-gray-400 mr-1.5">{index + 1}.</span>
                            {stage.name}
                        </p>
                        {payment && payment.amount > 0 && (
                            <p className="text-[11px] text-gray-400 mt-0.5">
                                ${payment.amount.toLocaleString()}
                            </p>
                        )}
                    </div>
                    <span
                        className={`text-[10px] font-bold uppercase tracking-tight px-2 py-0.5 rounded-full border flex-shrink-0 ${!paid
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : completed
                                ? "bg-green-50 text-green-700 border-green-100"
                                : "bg-blue-50 text-blue-700 border-blue-100"
                            }`}
                    >
                        {!paid ? "Payment due" : completed ? "Paid" : "In progress"}
                    </span>
                </div>

                {unlocked ? (
                    <a
                        href={deliverablesUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-all shadow-sm active:scale-95"
                    >
                        <FolderOpen className="w-4 h-4" />
                        Open Folder
                    </a>
                ) : (
                    <>
                        <button
                            disabled
                            title={lockReason}
                            className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-400 text-sm font-bold rounded-lg cursor-not-allowed border border-gray-200"
                        >
                            <Lock className="w-4 h-4" />
                            Open Folder
                        </button>
                        <p className="text-xs text-gray-400 mt-1.5">{lockReason}</p>
                        {!paid && onGoToPayments && (
                            <button
                                onClick={onGoToPayments}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 mt-1.5 cursor-pointer"
                            >
                                Go to payments →
                            </button>
                        )}
                    </>
                )}
            </div>
        );
    };

    return (
        <>
            {/* Files submitted with the original request */}
            <div className="space-y-4 mb-8">
                {intakeFiles.map((f) => (
                    <div key={f.label}>
                        <label className="block text-sm font-semibold text-gray-900 mb-1.5">{f.label}</label>
                        <div className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-400 bg-gray-50">
                            {f.value || "No file chosen"}
                        </div>
                    </div>
                ))}
                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                        Additional Project Photos
                    </label>
                    <div className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-400 bg-gray-50">
                        No files chosen
                    </div>
                </div>
            </div>

            {/* ─── Project Documents (shared folder, consultation-gated) ─── */}
            <div className="mb-8">
                <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
                    <h4 className="text-sm font-bold text-gray-900">Project Documents</h4>
                    {consultationPaid && (
                        <button
                            onClick={openAdd}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-white bg-gray-900 hover:bg-black rounded-lg transition-colors active:scale-95"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add Document
                        </button>
                    )}
                </div>
                <p className="text-xs text-gray-400 mb-3">
                    Links your project manager shares, and documents the architect asks you
                    to provide. You can add documents and manage the ones you added.
                </p>

                {!consultationPaid ? (
                    <div className="text-center py-10 space-y-2 border border-dashed border-gray-200 rounded-xl">
                        <Lock className="w-8 h-8 text-gray-300 mx-auto" />
                        <p className="text-xs text-gray-400">
                            Documents unlock once your consultation fee is paid.
                        </p>
                        {onGoToPayments && (
                            <button
                                onClick={onGoToPayments}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                            >
                                Go to payments →
                            </button>
                        )}
                    </div>
                ) : docs.length === 0 ? (
                    <div className="text-center py-10 space-y-2 border border-dashed border-gray-200 rounded-xl">
                        <FolderOpen className="w-8 h-8 text-gray-300 mx-auto" />
                        <p className="text-xs text-gray-400">
                            No documents yet. Add a link to share a document with your project
                            manager.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {docs.map((attachment) => {
                            const mine = !!myId && attachment.createdById === myId;
                            const href = toExternalUrl(attachment.url) ?? undefined;
                            return (
                                <div
                                    key={attachment.id}
                                    className="flex items-center justify-between gap-3 border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all bg-white"
                                >
                                    <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 min-w-0 flex-1"
                                    >
                                        <div className="w-10 h-10 rounded-xl border bg-blue-50 border-blue-100 flex items-center justify-center flex-shrink-0">
                                            <LinkIcon className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">
                                                {attachment.title}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                                                {mine
                                                    ? "Added by you"
                                                    : `Added by ${attachment.createdBy?.name ||
                                                    attachment.createdBy?.email ||
                                                    "your project manager"
                                                    }`}
                                            </p>
                                        </div>
                                    </a>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <a
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                                            title="Open / download"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                        {mine && (
                                            <>
                                                <button
                                                    onClick={() => openEdit(attachment)}
                                                    className="p-1.5 rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(attachment)}
                                                    className="p-1.5 rounded-md border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Final deliverables, one folder per phase */}
            <div className="mb-6">
                <div className="flex items-center justify-between gap-3 mb-1">
                    <h4 className="text-sm font-bold text-gray-900">Final Deliverables</h4>
                    {paymentInfo?.paymentMethod && (
                        <span className="text-[10px] font-bold uppercase tracking-tight px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200 flex-shrink-0">
                            {lumpSum ? "Lump sum" : "By phase"}
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-400 mb-3">
                    {lumpSum
                        ? "Once the project payment is complete, each phase folder opens as your project manager completes that phase."
                        : "Each phase folder opens once that phase is both paid for and completed."}
                </p>

                {stages.length === 0 ? (
                    <div className="text-center py-10 space-y-2 border border-dashed border-gray-200 rounded-xl">
                        <FolderOpen className="w-8 h-8 text-gray-300 mx-auto" />
                        <p className="text-xs text-gray-400">
                            Phases appear here once your proposal is accepted.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {stages.map((stage: any, index: number) => (
                            <PhaseDeliverable key={stage.id} stage={stage} index={index} />
                        ))}
                    </div>
                )}
            </div>

            {/* Add / edit document */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle>{editing ? "Edit Document" : "Add Document"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="clientDocTitle" className="mb-2 block">
                                Title
                            </Label>
                            <Input
                                id="clientDocTitle"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Property survey map"
                            />
                        </div>
                        <div>
                            <Label htmlFor="clientDocUrl" className="mb-2 block">
                                Link
                            </Label>
                            <Input
                                id="clientDocUrl"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://drive.google.com/..."
                            />
                            <p className="text-[11px] text-gray-400 mt-1.5">
                                Upload the file to Google Drive, Dropbox, etc. and paste a
                                shareable link here.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                        <button
                            onClick={() => setModalOpen(false)}
                            className="flex-1 cursor-pointer px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isCreating || isUpdating}
                            className="flex-1 px-4 py-2.5 cursor-pointer text-sm font-medium text-white bg-gray-900 hover:bg-black rounded-md transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                            {isCreating || isUpdating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : editing ? (
                                "Save Changes"
                            ) : (
                                "Add Document"
                            )}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <Dialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
            >
                <DialogContent className="max-w-sm bg-white">
                    <DialogHeader>
                        <DialogTitle>Delete Document</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-gray-500">
                        Are you sure you want to delete{" "}
                        <span className="font-semibold text-gray-700">
                            {deleteTarget?.title}
                        </span>
                        ? This cannot be undone.
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                        <button
                            onClick={() => setDeleteTarget(null)}
                            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                            {isDeleting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                "Delete"
                            )}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
