import { useRef, useState } from "react";
import {
    FileText,
    ImageIcon,
    Loader2,
    Trash2,
    Upload,
    ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import {
    useGetProjectDocumentsQuery,
    useUploadProjectDocumentMutation,
    useDeleteProjectDocumentMutation,
    DOCUMENT_KIND_LABELS,
    type ProjectDocument,
    type ProjectDocumentKind,
} from "@/redux/api/adminDashboard/projectDocumentApi";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif";

const SLOTS: {
    kind: ProjectDocumentKind;
    multiple: boolean;
    hint: string;
}[] = [
    {
        kind: "PROPERTY_BOUNDARY",
        multiple: false,
        hint: "PDF or image. Uploading again replaces the current file.",
    },
    {
        kind: "GEOTECHNICAL_REPORT",
        multiple: false,
        hint: "PDF or image. Uploading again replaces the current file.",
    },
    {
        kind: "PROJECT_PHOTO",
        multiple: true,
        hint: "Add as many photos as you like.",
    },
];

const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * The client's intake documents, uploadable at any time.
 *
 * The New Project form asks for these three up front, but a client who skipped
 * one used to have no way back — the fields sat here as dead placeholders. They
 * upload here instead, and the studio reads the same files on the project's
 * Information tab.
 */
export default function ProjectDocumentsCard({
    projectId,
}: {
    projectId: string;
}) {
    const { data: documents, isLoading } = useGetProjectDocumentsQuery(projectId);
    const [uploadDocument] = useUploadProjectDocumentMutation();
    const [deleteDocument, { isLoading: isDeleting }] =
        useDeleteProjectDocumentMutation();

    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const [uploadingKind, setUploadingKind] = useState<ProjectDocumentKind | null>(
        null,
    );
    const [deleteTarget, setDeleteTarget] = useState<ProjectDocument | null>(null);

    const items = documents || [];

    const handleFiles = async (
        kind: ProjectDocumentKind,
        fileList: FileList | null,
    ) => {
        const files = Array.from(fileList || []);
        if (!files.length) return;

        setUploadingKind(kind);
        try {
            // Sequential: a single-slot kind replaces server-side, so parallel
            // uploads of the same kind would race each other.
            for (const file of files) {
                await uploadDocument({ projectRequestId: projectId, kind, file }).unwrap();
            }
            toast.success(files.length > 1 ? "Files uploaded" : "File uploaded");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to upload file");
        } finally {
            setUploadingKind(null);
            const input = inputRefs.current[kind];
            if (input) input.value = "";
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteDocument(deleteTarget.id).unwrap();
            toast.success("File removed");
            setDeleteTarget(null);
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to remove file");
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900">
                    Project Documents
                </h3>
            </div>
            <p className="text-xs text-gray-500 mb-5">
                Survey maps, reports and photos for your project. You can add these at
                any time — they go straight to your project manager.
            </p>

            {isLoading ? (
                <div className="flex items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
                </div>
            ) : (
                <div className="space-y-5">
                    {SLOTS.map((slot) => {
                        const slotItems = items.filter((d) => d.kind === slot.kind);
                        const isUploading = uploadingKind === slot.kind;

                        return (
                            <div
                                key={slot.kind}
                                className="border border-gray-100 rounded-lg p-4 bg-gray-50/40"
                            >
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-900">
                                            {DOCUMENT_KIND_LABELS[slot.kind]}
                                        </p>
                                        <p className="text-[11px] text-gray-500">{slot.hint}</p>
                                    </div>

                                    <input
                                        ref={(el) => {
                                            inputRefs.current[slot.kind] = el;
                                        }}
                                        type="file"
                                        accept={ACCEPT}
                                        multiple={slot.multiple}
                                        className="hidden"
                                        onChange={(e) => handleFiles(slot.kind, e.target.files)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => inputRefs.current[slot.kind]?.click()}
                                        disabled={isUploading}
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex-shrink-0 cursor-pointer disabled:opacity-50"
                                    >
                                        {isUploading ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Upload className="w-3.5 h-3.5" />
                                        )}
                                        {slotItems.length && !slot.multiple ? "Replace" : "Upload"}
                                    </button>
                                </div>

                                {slotItems.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic py-3 text-center">
                                        No file chosen
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {slotItems.map((doc) => (
                                            <div
                                                key={doc.id}
                                                className="border border-gray-200 rounded-lg p-3 bg-white flex items-start justify-between gap-3"
                                            >
                                                <div className="flex items-start gap-2.5 min-w-0">
                                                    <div className="p-1.5 bg-gray-100 rounded-md flex-shrink-0">
                                                        {doc.mimeType?.startsWith("image/") ? (
                                                            <ImageIcon className="w-3.5 h-3.5 text-gray-500" />
                                                        ) : (
                                                            <FileText className="w-3.5 h-3.5 text-gray-500" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                                            {doc.fileName}
                                                        </p>
                                                        <a
                                                            href={doc.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-0.5"
                                                        >
                                                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                                            View file
                                                        </a>
                                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                                            {formatSize(doc.size)}
                                                            {doc.size ? " · " : ""}
                                                            {new Date(doc.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setDeleteTarget(doc)}
                                                    className="p-1.5 rounded-md border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors cursor-pointer flex-shrink-0"
                                                    title="Remove"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <Dialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
            >
                <DialogContent className="max-w-sm bg-white">
                    <DialogHeader>
                        <DialogTitle>Remove File</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-gray-500">
                        Are you sure you want to remove{" "}
                        <span className="font-semibold text-gray-700">
                            {deleteTarget?.fileName}
                        </span>
                        ? This cannot be undone.
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
                            {isDeleting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                "Remove"
                            )}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
