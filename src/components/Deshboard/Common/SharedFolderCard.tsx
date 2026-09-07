import { useState } from "react";
import {
    Loader2,
    LinkIcon,
    ExternalLink,
    Pencil,
    Trash2,
    FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import { toExternalUrl } from "@/utils/externalUrl";
import {
    useGetAttachmentsQuery,
    useCreateAttachmentMutation,
    useUpdateAttachmentMutation,
    useDeleteAttachmentMutation,
    type AttachmentSide,
    type ProjectAttachment,
} from "@/redux/api/adminDashboard/attachmentApi";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SharedFolderCardProps {
    projectId: string;
    /**
     * Which half of the card the viewer owns. They can add to it and edit or
     * delete its links; the other half is read-only to them.
     */
    side: AttachmentSide;
    /** Hides every add/edit/delete control, for read-only views of a project. */
    readOnly?: boolean;
}

/**
 * The project's shared folder.
 *
 * Both sides read the card, but only the architect adds, edits or deletes links
 * — the client just opens them. The server enforces the same rule, so a client
 * cannot touch the architect's links even by calling the API directly.
 *
 * Laid out to match the internal Project Folder card it sits under: same border,
 * padding and heading, and the same dashed "add" affordance. Emerald rather than
 * that card's blue, so the pair read as siblings while staying easy to tell
 * apart — the blue one is architect-only, the green one the client can see.
 */
export default function SharedFolderCard({
    projectId,
    side,
    readOnly = false,
}: SharedFolderCardProps) {
    const { data: attachments, isLoading } = useGetAttachmentsQuery(projectId);
    const [createAttachment, { isLoading: isCreating }] = useCreateAttachmentMutation();
    const [updateAttachment, { isLoading: isUpdating }] = useUpdateAttachmentMutation();
    const [deleteAttachment, { isLoading: isDeleting }] = useDeleteAttachmentMutation();

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<ProjectAttachment | null>(null);
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<ProjectAttachment | null>(null);

    const openCreate = () => {
        setEditing(null);
        setTitle("");
        setUrl("");
        setModalOpen(true);
    };

    const openEdit = (attachment: ProjectAttachment) => {
        setEditing(attachment);
        setTitle(attachment.title);
        setUrl(attachment.url);
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!title.trim() || !url.trim()) {
            toast.error("Please provide both a title and a link");
            return;
        }
        try {
            if (editing) {
                await updateAttachment({ attachmentId: editing.id, title, url }).unwrap();
                toast.success("Link updated");
            } else {
                await createAttachment({ projectRequestId: projectId, title, url }).unwrap();
                toast.success("Link added");
            }
            setModalOpen(false);
            setEditing(null);
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to save link");
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteAttachment(deleteTarget.id).unwrap();
            toast.success("Link deleted");
            setDeleteTarget(null);
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to delete link");
        }
    };

    // Only the architect's links are shown; a client viewing the card reads
    // them but has no controls, which the server enforces independently.
    const items = (attachments || []).filter((a) => a.ownerSide === "ARCHITECT");
    const canManage = side === "ARCHITECT" && !readOnly;

    return (
        <div className="border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                        Architect + Client Folder
                    </h3>
                </div>
            </div>
            <p className="text-xs text-gray-500 mb-4">
                External project folder, visible to both the architect and the client.
                The architect manages the links; the client can open them.
            </p>

            {isLoading ? (
                <div className="flex items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
                </div>
            ) : (
                <div className="space-y-2">
                    {items.map((attachment) => (
                        <div
                            key={attachment.id}
                            className="flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3"
                        >
                            <a
                                href={toExternalUrl(attachment.url) ?? undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-900 font-medium truncate max-w-[70%]"
                                title={attachment.url}
                            >
                                <ExternalLink className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{attachment.title}</span>
                            </a>
                            {canManage && (
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => openEdit(attachment)}
                                        className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                                    >
                                        <Pencil className="w-3 h-3" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setDeleteTarget(attachment)}
                                        className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    {canManage && (
                        <button
                            onClick={openCreate}
                            className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-800 font-medium border border-dashed border-emerald-300 rounded-lg px-4 py-3 w-full justify-center hover:bg-emerald-50 transition-colors cursor-pointer"
                        >
                            <LinkIcon className="w-4 h-4" />
                            Add Shared Folder Link
                        </button>
                    )}

                    {/* A client with nothing shared yet would otherwise see an
                        empty card and no explanation, since the add button is
                        the architect's alone. */}
                    {!canManage && items.length === 0 && (
                        <p className="text-xs text-gray-400 italic py-3 text-center">
                            No links shared by the architect yet.
                        </p>
                    )}
                </div>
            )}

            {/* Add / edit */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle>{editing ? "Edit Link" : "Add Link"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="sharedFolderTitle" className="mb-2 block">
                                Title
                            </Label>
                            <Input
                                id="sharedFolderTitle"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Design Development Deliverables"
                            />
                        </div>
                        <div>
                            <Label htmlFor="sharedFolderUrl" className="mb-2 block">
                                Folder Link
                            </Label>
                            <Input
                                id="sharedFolderUrl"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://drive.google.com/..."
                            />
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
                            className="flex-1 px-4 py-2.5 cursor-pointer text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                            {isCreating || isUpdating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : editing ? (
                                "Save Changes"
                            ) : (
                                "Add Link"
                            )}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent className="max-w-sm bg-white">
                    <DialogHeader>
                        <DialogTitle>Delete Link</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-gray-500">
                        Are you sure you want to delete{" "}
                        <span className="font-semibold text-gray-700">{deleteTarget?.title}</span>?
                        This cannot be undone.
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                        <button
                            onClick={() => setDeleteTarget(null)}
                            className="flex-1 px-4 py-2.5 cursor-pointer text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2.5 cursor-pointer text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
