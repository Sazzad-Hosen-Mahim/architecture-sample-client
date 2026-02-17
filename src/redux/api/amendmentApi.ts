import { baseApi } from "./baseApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AmendmentUrgency = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type AmendmentStatus =
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "IN_PROGRESS"
    | "COMPLETED";

export interface Amendment {
    id: string;
    proposalId: string;
    projectName: string;
    description: string;
    services: string;
    urgency: AmendmentUrgency;
    status: AmendmentStatus;
    reviewNotes?: string | null;
    reviewedAt?: string | null;
    reviewedBy?: string | null;
    completedAt?: string | null;
    createdAt: string;
    updatedAt: string;
    proposal?: any;
    proposals?: any[];
}

export interface CreateAmendmentRequest {
    proposalId: string;
    projectName: string;
    description: string;
    services: string;
    urgency: AmendmentUrgency;
}

export interface ReviewAmendmentRequest {
    amendmentId: string;
    action: "APPROVED" | "REJECTED";
    reviewNotes: string;
}

export interface CreateProposalFromAmendmentRequest {
    amendmentId: string;
    name: string;
    description: string;
    budgetRange: string;
    expectedTimeline: string;
    taxRate: number;
    notes: string;
}

export interface AmendmentResponse {
    success: boolean;
    message: string;
    data: Amendment;
}

export interface AmendmentsListResponse {
    success: boolean;
    message: string;
    data: Amendment[];
}

export interface AmendmentProposalsResponse {
    success: boolean;
    message: string;
    data: any[];
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const amendmentApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Client creates an amendment for a proposal
        createAmendment: builder.mutation<AmendmentResponse, CreateAmendmentRequest>({
            query: ({ proposalId, ...body }) => ({
                url: `/proposals/${proposalId}/amendments`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Amendment", "Project"],
        }),

        // Get pending amendments for a proposal (admin/PM)
        getAmendments: builder.query<AmendmentsListResponse, { proposalId: string; status?: string }>({
            query: ({ proposalId, status }) => ({
                url: `/proposals/${proposalId}/amendments`,
                method: "GET",
                params: status ? { status } : undefined,
            }),
            providesTags: ["Amendment"],
        }),

        // Admin/PM reviews (approve/reject) an amendment
        reviewAmendment: builder.mutation<AmendmentResponse, ReviewAmendmentRequest>({
            query: ({ amendmentId, action, reviewNotes }) => ({
                url: `/proposals/amendments/${amendmentId}/review`,
                method: "PATCH",
                body: { action, reviewNotes },
            }),
            invalidatesTags: ["Amendment", "Project"],
        }),

        // Admin/PM creates a proposal from an approved amendment
        createProposalFromAmendment: builder.mutation<any, CreateProposalFromAmendmentRequest>({
            query: ({ amendmentId, ...body }) => ({
                url: `/proposals/amendments/${amendmentId}/create-proposal`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Amendment", "Project"],
        }),

        // Both user and PM can get all proposals for a given proposal (includes amendment proposals)
        getAllProposalsForProposal: builder.query<AmendmentProposalsResponse, string>({
            query: (proposalId) => ({
                url: `/proposals/${proposalId}/all-proposals`,
                method: "GET",
            }),
            providesTags: ["Amendment", "Project"],
        }),

        // PM completes an amendment
        completeAmendment: builder.mutation<AmendmentResponse, string>({
            query: (amendmentId) => ({
                url: `/proposals/amendments/${amendmentId}/complete`,
                method: "PATCH",
            }),
            invalidatesTags: ["Amendment", "Project"],
        }),
    }),
});

export const {
    useCreateAmendmentMutation,
    useGetAmendmentsQuery,
    useReviewAmendmentMutation,
    useCreateProposalFromAmendmentMutation,
    useGetAllProposalsForProposalQuery,
    useCompleteAmendmentMutation,
} = amendmentApi;
