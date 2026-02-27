import { baseApi } from "./baseApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AmendmentUrgency = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

// Must match backend Prisma enum: PENDING, UNDER_REVIEW, APPROVED, REJECTED, COMPLETED
export type AmendmentStatus =
    | "PENDING"
    | "UNDER_REVIEW"
    | "APPROVED"
    | "REJECTED"
    | "COMPLETED";

export interface AmendmentProposalRef {
    id: string;
    proposalNumber: string;
    status: string;
    totalAmount?: string | number;
}

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
    reviewedBy?: any;
    requestedBy?: any;
    completedAt?: string | null;
    amendmentProposalId?: string | null;
    amendmentProposal?: AmendmentProposalRef | null;
    createdAt: string;
    updatedAt: string;
    proposal?: any;
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

// The all-proposals endpoint returns { normalProposal, amendmentProposals, totalProposals }
export interface AllProposalsForProposalResponse {
    success: boolean;
    message: string;
    data: {
        normalProposal: any;
        amendmentProposals: any[];
        totalProposals: number;
    };
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

        // Get amendments for a proposal (admin/PM or client)
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

        // Get all proposals for a specific proposal (normal + amendments)
        getAllProposalsForProposal: builder.query<AllProposalsForProposalResponse, string>({
            query: (proposalId) => ({
                url: `/proposals/${proposalId}/all-proposals`,
                method: "GET",
            }),
            providesTags: ["Amendment", "Project"],
        }),

        // PM completes an amendment (only after amendment proposal is ACCEPTED by client)
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
