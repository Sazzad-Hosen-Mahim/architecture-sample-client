import { useState } from "react";
import { toExternalUrl } from "@/utils/externalUrl";
import { ProjectRequest } from "@/redux/api/adminDashboard/proposalApi";
import {
    useGetAttachmentsQuery,
    useCreateAttachmentMutation,
    useUpdateAttachmentMutation,
    useDeleteAttachmentMutation,
    ProjectAttachment,
} from "@/redux/api/adminDashboard/attachmentApi";
import {
    Loader2,
    LinkIcon,
    ExternalLink,
    Pencil,
    Trash2,
    Plus,
    FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type AttachmentsTabProps = {
    project: ProjectRequest;
};

export default function AttachmentsTab({ project }: AttachmentsTabProps) {
    const { data: attachments, isLoading } = useGetAttachmentsQuery(project.id);
    const [createAttachment, { isLoading: isCreating }] = useCreateAttachmentMutation();
    const [updateAttachment, { isLoading: isUpdating }] = useUpdateAttachmentMutation();
    const [deleteAttachment, { isLoading: isDeleting }] = useDeleteAttachmentMutation();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingAttachment, setEditingAttachment] = useState<ProjectAttachment | null>(null);
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<ProjectAttachment | null>(null);

    const openCreateModal = () => {
        setEditingAttachment(null);
        setTitle("");
        setUrl("");
        setModalOpen(true);
    };

    const openEditModal = (attachment: ProjectAttachment) => {
        setEditingAttachment(attachment);
        setTitle(attachment.title);
        setUrl(attachment.url);
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!title.trim() || !url.trim()) {
            toast.error("Please provide both a title and a URL");
            return;
        }

        try {
            if (editingAttachment) {
                await updateAttachment({ attachmentId: editingAttachment.id, title, url }).unwrap();
                toast.success("Attachment updated");
            } else {
                await createAttachment({ projectRequestId: project.id, title, url }).unwrap();
                toast.success("Attachment added");
            }
            setModalOpen(false);
            setEditingAttachment(null);
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to save attachment");
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteAttachment(deleteTarget.id).unwrap();
            toast.success("Attachment deleted");
            setDeleteTarget(null);
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to delete attachment");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
                <span className="text-gray-500 text-sm">Loading attachments...</span>
            </div>
        );
    }

    const items = attachments || [];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Attachments</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Drive links and other resources shared with the client for this project.
                    </p>
                </div>
                <Button onClick={openCreateModal} className="gap-1.5">
                    <Plus className="w-4 h-4" />
                    Add Attachment
                </Button>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-16 space-y-3 border border-dashed border-gray-200 rounded-xl">
                    <FolderOpen className="w-10 h-10 text-gray-300 mx-auto" />
                    <p className="text-gray-500 text-sm">No attachments yet.</p>
                    <p className="text-xs text-gray-400">Add a link for the client to access project resources.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {items.map((attachment) => (
                        <div
                            key={attachment.id}
                            className="border border-gray-200 rounded-xl p-4 bg-white flex items-start justify-between gap-3"
                        >
                            <div className="flex items-start gap-3 min-w-0">
                                <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                                    <LinkIcon className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{attachment.title}</p>
                                    <a
                                        href={toExternalUrl(attachment.url) ?? undefined}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 truncate mt-1"
                                    >
                                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">{attachment.url}</span>
                                    </a>
                                    {attachment.createdBy && (
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            Added by {attachment.createdBy.name || attachment.createdBy.email}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                    onClick={() => openEditModal(attachment)}
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
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle>{editingAttachment ? "Edit Attachment" : "Add Attachment"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="attachmentTitle" className="mb-2 block">Title</Label>
                            <Input
                                id="attachmentTitle"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Site Survey Documents"
                            />
                        </div>
                        <div>
                            <Label htmlFor="attachmentUrl" className="mb-2 block">URL</Label>
                            <Input
                                id="attachmentUrl"
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
                            ) : editingAttachment ? (
                                "Save Changes"
                            ) : (
                                "Add Attachment"
                            )}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete Attachment</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-gray-500">
                        Are you sure you want to delete{" "}
                        <span className="font-semibold text-gray-700">{deleteTarget?.title}</span>? This cannot be undone.
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
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
