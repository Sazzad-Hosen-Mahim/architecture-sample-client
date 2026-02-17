import { baseApi } from "../baseApi";

// Define types based on the API response
export interface ProjectRequest {
    id: string;
    clientFirstName: string;
    clientMiddleName: string;
    clientLastName: string;
    companyName: string;
    email: string;
    phone: string;
    country: string;
    state: string;
    city: string;
    streetAddress: string;
    additionalComments: string;
    projectName: string;
    projectLocationSameAsClient: boolean;
    projectCountry: string;
    projectState: string;
    projectCity: string;
    projectStreetAddress: string;
    projectZipCode: string;
    serviceType: string;
    projectCategory: string;
    projectSize: string;
    budgetRange: string;
    preferredArchitecturalStyle: string;
    siteConstraints: string;
    sustainabilityGoals: string;
    specialRequirements: string;
    appointmentDate: string;
    appointmentTime: string;
    appointmentType: string;
    additionalNotes: string;
    status: "PENDING" | "REVIEWED" | "SCHEDULED" | "COMPLETED";
    userId: string | null;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
    user: any | null;
    assets: any[];
}

export interface ProjectRequestsResponse {
    data: ProjectRequest[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface SendProposalRequest {
    projectRequestId: string;
    name: string;
    description: string;
    additionalContext: string;
    streetAddress: string;
    city: string;
    state: string;
    country: string;
    zip: string;
    serviceType: string;
    projectCategory: string;
    squareFootage: string;
    budgetRange: string;
    expectedTimeline: string;
}

export interface Proposal {
    id: string;
    projectRequestId: string;
    userId: string;
    proposalNumber: string;
    title: string;
    subject: string | null;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    clientCompany: string | null;
    projectName: string;
    projectLocation: string;
    projectDescription: string;
    additionalContext: string;
    serviceType: string;
    projectCategory: string;
    squareFootage: string;
    budgetRange: string;
    expectedTimeline: string;
    status: "DRAFT" | "SENT" | "VIEWED" | "ACCEPTED" | "REJECTED" | "REVISED";
    sentAt: string | null;
    viewedAt: string | null;
    respondedAt: string | null;
    expiresAt: string | null;
    subtotal: string;
    taxRate: number | null;
    taxAmount: string;
    totalAmount: string;
    paymentMethod: string | null;
    paymentTerms: string | null;
    estimatedDuration: string | null;
    contactInfo: string | null;
    ownerSignature: string | null;
    ownerSignedAt: string | null;
    ownerSignedBy: string | null;
    architectSignature: string | null;
    architectSignedAt: string | null;
    architectSignedBy: string | null;
    notes: string | null;
    termsAndConditions: string | null;
    createdById: string;
    projectId: string | null;
    createdAt: string;
    updatedAt: string;
    services: ProposalService[];
    credits: any[];
    projectStages: any[];
    projectRequest: {
        id: string;
        projectName: string;
        status: string;
    };
    createdBy: {
        id: string;
        name: string;
        email: string;
    };
}

export interface ProposalService {
    id: string;
    proposalId: string;
    name: string;
    description: string | null;
    order: number;
    timelineWeeks: number | null;
    active: boolean;
    rate: string;
    quantity: number;
    unit: string | null;
    amount: string;
    approvalStatus: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
    requiresApproval: boolean;
    approvedAt: string | null;
    approvedBy: string | null;
    rejectedAt: string | null;
    rejectedBy: string | null;
    rejectionReason: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ServiceApprovalRequest {
    proposalId: string;
    serviceId: string;
    action: "approve" | "reject";
    rejectionReason?: string;
}

export interface ServiceApprovalResponse {
    success: boolean;
    message: string;
    data: ProposalService;
}

export interface MyProposalsResponse {
    success: boolean;
    message: string;
    data: Proposal[];
}

export const proposalApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getProjectRequests: builder.query<ProjectRequestsResponse, void>({
            query: () => ({
                url: "/project-requests",
                method: "GET",
            }),
            providesTags: ["Project"],
        }),

        getProjectRequestById: builder.query<ProjectRequest, string>({
            query: (id) => ({
                url: `/project-requests/${id}`,
                method: "GET",
            }),
            providesTags: ["Project"],
        }),
        updateProjectRequestStatus: builder.mutation<
            ProjectRequest,
            { id: string; status: ProjectRequest["status"]; notes?: string }
        >({
            query: ({ id, status, notes }) => ({
                url: `/project-requests-admin/${id}/status`,
                method: "PATCH",
                body: {
                    status,
                    notes,
                },
            }),
            invalidatesTags: ["Project"],
        }),
        getProposalInfo: builder.query<ProjectRequest, string>({
            query: (id) => ({
                url: `/project-requests-admin/${id}`,
                method: "GET",
            }),
            providesTags: ["Project"],
        }),
        submitNewProposal: builder.mutation<ProjectRequest, SendProposalRequest>({
            query: (payload) => ({
                url: `/proposals`,
                method: "POST",
                body: payload,
            }),
            invalidatesTags: ["Project"],
        }),
        addService: builder.mutation<ProjectRequest, { name: string; cost: number; timelineWeeks: number; id: string }>({
            query: ({ name, cost, timelineWeeks, id }) => ({
                url: `/proposals/${id}/services`,
                method: "POST",
                body: { name, cost, timelineWeeks },
            }),
            invalidatesTags: ["Project"],
        }),
        sendProposalToClient: builder.mutation<ProjectRequest, { id: string }>({
            query: ({ id }) => ({
                url: `/proposals/${id}/send`,
                method: "POST",
            }),
            invalidatesTags: ["Project"],
        }),
        getMyProposals: builder.query<MyProposalsResponse, void>({
            query: () => ({
                url: "/proposals/my-proposals",
                method: "GET",
            }),
            providesTags: ["Project"],
        }),
        getSingleProposal: builder.query<MyProposalsResponse, string>({
            query: (id) => ({
                url: `/proposals/${id}`,
                method: "GET",
            }),
            providesTags: ["Project"],
        }),
        changeProposalStatus: builder.mutation<MyProposalsResponse, { id: string; status: string }>({
            query: ({ id, status }) => ({
                url: `/proposals/${id}/status`,
                method: "PATCH",
                body: { status },
            }),
            invalidatesTags: ["Project"],
        }),
        getAdminViewAllProposals: builder.query<MyProposalsResponse, void>({
            query: () => ({
                url: "/proposals",
                method: "GET",
            }),
            providesTags: ["Project"],
        }),

        approveRejectService: builder.mutation<ServiceApprovalResponse, ServiceApprovalRequest>({
            query: ({ proposalId, serviceId, action, rejectionReason }) => ({
                url: `/proposals/${proposalId}/services/${serviceId}/approval`,
                method: "POST",
                body: rejectionReason ? { action, rejectionReason } : { action },
            }),
            invalidatesTags: ["Project"],
        }),

    }),
});

export const {
    useGetProjectRequestsQuery,
    useGetProjectRequestByIdQuery,
    useUpdateProjectRequestStatusMutation,
    useGetProposalInfoQuery,
    useSubmitNewProposalMutation,
    useAddServiceMutation,
    useSendProposalToClientMutation,
    useGetMyProposalsQuery,
    useGetSingleProposalQuery,
    useChangeProposalStatusMutation,
    useGetAdminViewAllProposalsQuery,
    useApproveRejectServiceMutation,
} = proposalApi;