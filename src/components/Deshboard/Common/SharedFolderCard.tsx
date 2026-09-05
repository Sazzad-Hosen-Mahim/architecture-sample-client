import { useState } from "react";
import {
    Loader2,
    LinkIcon,
    ExternalLink,
    Pencil,
    Trash2,
    Plus,
    FolderOpen,
    HardHat,
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

const SECTIONS: {
    side: AttachmentSide;
    title: string;
    blurb: string;
    icon: typeof HardHat;
    accent: string;
}[] = [
    {
        side: "ARCHITECT",
        title: "Architect",
        blurb: "Folders and deliverables shared by the architect.",
        icon: HardHat,
        accent: "text-blue-600 bg-blue-50",
    },
];

/**
 * The project's shared folder: an Architect section only.
 *
 * Both sides read the card, but only the architect adds, edits or deletes links
 * — the client just opens them. The server enforces the same rule, so a client
 * cannot touch the architect's links even by calling the API directly.
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

    const items = attachments || [];

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between gap-3 mb-1">
                <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900">
                        Architect + Client Folder
                    </h3>
                </div>
            </div>
            <p className="text-xs text-gray-500 mb-5">
                External project folder, visible to both the architect and the client.
                The architect manages the links; the client can open them.
            </p>

            {isLoading ? (
                <div className="flex items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
                </div>
            ) : (
                <div className="space-y-5">
                    {SECTIONS.map((section) => {
                        const sectionItems = items.filter((a) => a.ownerSide === section.side);
                        const isMine = section.side === side && !readOnly;
                        const Icon = section.icon;

                        return (
                            <div
                                key={section.side}
                                className="border border-gray-100 rounded-lg p-4 bg-gray-50/40"
                            >
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-start gap-2.5 min-w-0">
                                        <div className={`p-1.5 rounded-md flex-shrink-0 ${section.accent}`}>
                                            <Icon className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-900">
                                                {section.title} Section
                                            </p>
                                            <p className="text-[11px] text-gray-500">{section.blurb}</p>
                                        </div>
                                    </div>
                                    {isMine && (
                                        <button
                                            onClick={openCreate}
                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex-shrink-0 cursor-pointer"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            Add Link
                                        </button>
                                    )}
                                </div>

                                {sectionItems.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic py-3 text-center">
                                        {isMine
                                            ? "No links yet — add one for the other side to see."
                                            : `No links shared by the ${section.title.toLowerCase()} yet.`}
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {sectionItems.map((attachment) => (
                                            <div
                                                key={attachment.id}
                                                className="border border-gray-200 rounded-lg p-3 bg-white flex items-start justify-between gap-3"
                                            >
                                                <div className="flex items-start gap-2.5 min-w-0">
                                                    <div className="p-1.5 bg-gray-100 rounded-md flex-shrink-0">
                                                        <LinkIcon className="w-3.5 h-3.5 text-gray-500" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                                            {attachment.title}
                                                        </p>
                                                        <a
                                                            href={toExternalUrl(attachment.url) ?? undefined}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 truncate mt-0.5"
                                                        >
                                                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                                            <span className="truncate">{attachment.url}</span>
                                                        </a>
                                                        {attachment.createdBy && (
                                                            <p className="text-[10px] text-gray-400 mt-0.5">
                                                                Added by{" "}
                                                                {attachment.createdBy.name ||
                                                                    attachment.createdBy.email}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {isMine && (
                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                        <button
                                                            onClick={() => openEdit(attachment)}
                                                            className="p-1.5 rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors cursor-pointer"
                                                            title="Edit"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteTarget(attachment)}
                                                            className="p-1.5 rounded-md border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors cursor-pointer"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
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
