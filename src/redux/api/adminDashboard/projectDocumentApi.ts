import { baseApi } from "../baseApi";

/**
 * The three intake documents the New Project form asks for. A client who
 * skipped one at submission uploads it later from their Documents tab; the
 * studio reads them on the project's Information tab.
 */
export type ProjectDocumentKind =
    | "PROPERTY_BOUNDARY"
    | "GEOTECHNICAL_REPORT"
    | "PROJECT_PHOTO";

export interface ProjectDocument {
    id: string;
    projectRequestId: string;
    kind: ProjectDocumentKind;
    fileName: string;
    url: string;
    publicId: string | null;
    mimeType: string | null;
    size: number | null;
    uploadedById: string;
    uploadedBy?: { id: string; name: string | null; email: string };
    createdAt: string;
    updatedAt: string;
}

export const DOCUMENT_KIND_LABELS: Record<ProjectDocumentKind, string> = {
    PROPERTY_BOUNDARY: "Property Boundary / Survey Map",
    GEOTECHNICAL_REPORT: "Geotechnical Report / Survey",
    PROJECT_PHOTO: "Additional Project Photos",
};

export const projectDocumentApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getProjectDocuments: builder.query<ProjectDocument[], string>({
            query: (projectRequestId) => ({
                url: `/project-requests-admin/${projectRequestId}/documents`,
                method: "GET",
            }),
            providesTags: ["ProjectDocument"],
        }),

        uploadProjectDocument: builder.mutation<
            ProjectDocument,
            { projectRequestId: string; kind: ProjectDocumentKind; file: File }
        >({
            query: ({ projectRequestId, kind, file }) => {
                const body = new FormData();
                body.append("file", file);
                body.append("kind", kind);
                return {
                    url: `/project-requests-admin/${projectRequestId}/documents`,
                    method: "POST",
                    body,
                };
            },
            invalidatesTags: ["ProjectDocument"],
        }),

        deleteProjectDocument: builder.mutation<
            { success: boolean; message: string },
            string
        >({
            query: (documentId) => ({
                url: `/project-requests-admin/documents/${documentId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["ProjectDocument"],
        }),
    }),
});

export const {
    useGetProjectDocumentsQuery,
    useUploadProjectDocumentMutation,
    useDeleteProjectDocumentMutation,
} = projectDocumentApi;
