import { FileText, ImageIcon, ExternalLink } from "lucide-react";
import {
    useGetProjectDocumentsQuery,
    DOCUMENT_KIND_LABELS,
    type ProjectDocumentKind,
} from "@/redux/api/adminDashboard/projectDocumentApi";

const ORDER: ProjectDocumentKind[] = [
    "PROPERTY_BOUNDARY",
    "GEOTECHNICAL_REPORT",
    "PROJECT_PHOTO",
];

const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * The studio's read-only view of the client's intake documents.
 *
 * These are the client's files, so there are no controls here — the client
 * uploads and removes them from their own Documents tab, and the server refuses
 * a manager's delete.
 */
export default function ClientDocumentsCard({
    projectId,
}: {
    projectId: string;
}) {
    const { data: documents, isLoading } = useGetProjectDocumentsQuery(projectId);
    const items = documents || [];

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900">
                    Client Documents
                </h3>
            </div>
            <p className="text-xs text-gray-500 mb-5">
                Survey maps, reports and photos uploaded by the client. Only they can
                add or remove these.
            </p>

            {isLoading ? (
                <div className="flex items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
                </div>
            ) : items.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-6 text-center">
                    The client hasn't uploaded any documents yet.
                </p>
            ) : (
                <div className="space-y-5">
                    {ORDER.map((kind) => {
                        const kindItems = items.filter((d) => d.kind === kind);
                        if (!kindItems.length) return null;

                        return (
                            <div
                                key={kind}
                                className="border border-gray-100 rounded-lg p-4 bg-gray-50/40"
                            >
                                <p className="text-sm font-bold text-gray-900 mb-3">
                                    {DOCUMENT_KIND_LABELS[kind]}
                                </p>
                                <div className="space-y-2">
                                    {kindItems.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className="border border-gray-200 rounded-lg p-3 bg-white flex items-start gap-2.5"
                                        >
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
                                                    Uploaded{" "}
                                                    {new Date(doc.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
