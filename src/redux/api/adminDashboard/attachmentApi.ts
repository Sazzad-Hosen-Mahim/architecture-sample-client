import { baseApi } from "../baseApi";

/**
 * Which half of the shared project folder a link sits in. Both sides see every
 * link; each side may only edit and delete its own. The server sets this from
 * the creator's role, so it is never sent on create.
 */
export type AttachmentSide = "ARCHITECT" | "CLIENT";

export interface ProjectAttachment {
    id: string;
    projectRequestId: string;
    title: string;
    url: string;
    ownerSide: AttachmentSide;
    createdById: string;
    createdBy?: { id: string; name: string | null; email: string };
    createdAt: string;
    updatedAt: string;
}

export const attachmentApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getAttachments: builder.query<ProjectAttachment[], string>({
            query: (projectRequestId) => ({
                url: `/project-requests-admin/${projectRequestId}/attachments`,
                method: "GET",
            }),
            providesTags: ["Attachment"],
        }),

        createAttachment: builder.mutation<
            ProjectAttachment,
            { projectRequestId: string; title: string; url: string }
        >({
            query: ({ projectRequestId, title, url }) => ({
                url: `/project-requests-admin/${projectRequestId}/attachments`,
                method: "POST",
                body: { title, url },
            }),
            invalidatesTags: ["Attachment"],
        }),

        updateAttachment: builder.mutation<
            ProjectAttachment,
            { attachmentId: string; title?: string; url?: string }
        >({
            query: ({ attachmentId, title, url }) => ({
                url: `/project-requests-admin/attachments/${attachmentId}`,
                method: "PATCH",
                body: { title, url },
            }),
            invalidatesTags: ["Attachment"],
        }),

        deleteAttachment: builder.mutation<{ success: boolean; message: string }, string>({
            query: (attachmentId) => ({
                url: `/project-requests-admin/attachments/${attachmentId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Attachment"],
        }),
    }),
});

export const {
    useGetAttachmentsQuery,
    useCreateAttachmentMutation,
    useUpdateAttachmentMutation,
    useDeleteAttachmentMutation,
} = attachmentApi;
