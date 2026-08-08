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
    aptSuiteUnit?: string | null;
    zipCode?: string | null;
    additionalComments: string;
    projectName: string;
    projectLocationSameAsClient: boolean;
    projectCountry: string;
    projectState: string;
    projectCity: string;
    projectStreetAddress: string;
    projectAptSuiteUnit?: string | null;
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
    driveLink: string | null;
    isNewInquiry: boolean;
    consultationPaymentId?: string | null;
    isArchived: boolean;
    archiverId: string | null;
    archivedAt: string | null;
    status: "PENDING" | "REVIEWED" | "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
    userId: string | null;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
    user: any | null;
    assets: any[];
    proposals?: Proposal[];
    meetingLinks?: any[];
    assignedManagerId?: string | null;
    assignedManager?: { id: string; name: string; email: string; avatar: string | null } | null;
    teams?: Team[];
    isProjectStarted?: boolean;
    projectStartedAt?: string | null;
    projectCompletedAt?: string | null;
    totalDurationMonths?: number | null;
    stages?: { id: string; name: string; status: string; progress: number; driveLink: string | null; completedAt: string | null }[];
}

export interface Team {
    id: string;
    name: string;
    createdById: string;
    members: { id: string; name: string; email: string; avatar: string | null; role: string }[];
    _count?: {
        projects: number;
    };
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
    // expectedTimeline: string;
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
    paymentType?: string | null;
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
    proposalType?: "NORMAL" | "AMENDMENT";
    parentProposalId?: string | null;
    contractSections?: any[];
    architectContractSignature?: string | null;
    clientContractSignature?: string | null;
    clientContractSignedAt?: string | null;
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
                url: "/project-requests-admin",
                method: "GET",
            }),
            providesTags: ["Project"],
        }),

        getProjectRequestById: builder.query<ProjectRequest, string>({
            query: (id) => ({
                url: `/project-requests-admin/${id}`,
                method: "GET",
            }),
            transformResponse: (response: any) => response.data || response,
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
            transformResponse: (response: any) => response.data || response,
            providesTags: ["Project"],
        }),
        getProposalFull: builder.query<{ success: boolean; data: Proposal }, string>({
            query: (id) => ({
                url: `/proposals/${id}/full`,
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
        addService: builder.mutation<ProjectRequest, { name: string; cost: number; timelineWeeks?: number; description?: string; order?: number; id: string }>({
            query: ({ name, cost, timelineWeeks, description, order, id }) => ({
                url: `/proposals/${id}/services`,
                method: "POST",
                body: { name, cost, timelineWeeks, description, order },
            }),
            invalidatesTags: ["Project"],
        }),
        // The proposal row is created on the Project step, before the PM has
        // picked a payment plan on the Services step — so the plan has to be
        // patched onto the DRAFT afterwards or it silently stays LUMP_SUM.
        updateProposalPaymentPlan: builder.mutation<unknown, { id: string; paymentMethod: string }>({
            query: ({ id, paymentMethod }) => ({
                url: `/proposals/${id}`,
                method: "PATCH",
                body: { paymentMethod },
            }),
            invalidatesTags: ["Project"],
        }),
        reorderProposalServices: builder.mutation<unknown, { id: string; items: { id: string; order: number }[] }>({
            query: ({ id, items }) => ({
                url: `/proposals/${id}/services/reorder`,
                method: "PATCH",
                body: { items },
            }),
            invalidatesTags: ["Project"],
        }),
        sendProposalToClient: builder.mutation<ProjectRequest, { id: string; architectSignature?: string; scopeNotes?: string }>({
            query: ({ id, architectSignature, scopeNotes }) => ({
                url: `/proposals/${id}/send`,
                method: "POST",
                body: { architectSignature, scopeNotes },
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
        signProposal: builder.mutation<any, { id: string; signature: string; type: 'owner' | 'architect' }>({
            query: ({ id, signature, type }) => ({
                url: `/proposals/${id}/sign`,
                method: "PATCH",
                body: { signature, type },
            }),
            invalidatesTags: ["Project"],
        }),

        // Fetch proposals by project request ID
        getProposalsByProjectRequest: builder.query<{ success: boolean; message: string; data: Proposal[] }, string>({
            query: (projectRequestId) => `/proposals?projectRequestId=${projectRequestId}`,
            providesTags: ["Project"],
        }),

        // Project Stage endpoints
        getStagesByProposal: builder.query<any, string>({
            query: (proposalId) => `/project-stages/proposal/${proposalId}`,
            providesTags: ["Project"],
        }),

        completeStage: builder.mutation<any, { id: string; notes?: string }>({
            query: ({ id, notes }) => ({
                url: `/project-stages/${id}/complete`,
                method: "POST",
                body: { notes },
            }),
            invalidatesTags: ["Project"],
        }),

        updateStage: builder.mutation<any, { id: string; driveLink?: string; notes?: string; internalDeadline?: string | null; externalDeadline?: string | null }>({
            query: ({ id, ...body }) => ({
                url: `/project-stages/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Project"],
        }),
        addStageNote: builder.mutation<any, { id: string; notes: string }>({
            query: ({ id, notes }) => ({
                url: `/project-stages/${id}/notes`,
                method: "POST",
                body: { notes },
            }),
            invalidatesTags: ["Project"],
        }),
        startPhaseTimer: builder.mutation<any, string>({
            query: (id) => ({
                url: `/project-stages/${id}/start-timer`,
                method: "POST",
            }),
            invalidatesTags: ["Project"],
        }),
        stopPhaseTimer: builder.mutation<any, string>({
            query: (id) => ({
                url: `/project-stages/${id}/stop-timer`,
                method: "POST",
            }),
            invalidatesTags: ["Project"],
        }),
        getMyProjectRequests: builder.query<ProjectRequestsResponse, void>({
            query: () => ({
                url: "/project-requests-admin/my-requests",
                method: "GET",
            }),
            providesTags: ["Project"],
        }),
        updateProjectDriveLink: builder.mutation<any, { id: string; driveLink: string }>({
            query: ({ id, driveLink }) => ({
                url: `/project-requests-admin/${id}/drive-link`,
                method: "PATCH",
                body: { driveLink },
            }),
            invalidatesTags: ["Project"],
        }),
        deleteProjectDriveLink: builder.mutation<any, string>({
            query: (id) => ({
                url: `/project-requests-admin/${id}/drive-link`,
                method: "DELETE",
            }),
            invalidatesTags: ["Project"],
        }),
        deleteProposal: builder.mutation<any, string>({
            query: (id) => ({
                url: `/proposals/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Project"],
        }),
        archiveProject: builder.mutation<any, string>({
            query: (id) => ({
                url: `/project-requests-admin/${id}/archive`,
                method: "PATCH",
            }),
            invalidatesTags: ["Project"],
        }),
        unarchiveProject: builder.mutation<any, string>({
            query: (id) => ({
                url: `/project-requests-admin/${id}/unarchive`,
                method: "PATCH",
            }),
            invalidatesTags: ["Project"],
        }),
        deleteProject: builder.mutation<any, { id: string; password: string }>({
            query: ({ id, password }) => ({
                url: `/project-requests-admin/${id}`,
                method: "DELETE",
                body: { password },
            }),
            invalidatesTags: ["Project"],
        }),
        getArchivedProjects: builder.query<ProjectRequest[], void>({
            query: () => ({
                url: "/project-requests-admin/archived",
                method: "GET",
            }),
            providesTags: ["Project"],
        }),
        getProjectManagers: builder.query<{ success: boolean; data: { id: string; name: string; email: string; avatar: string | null }[] }, void>({
            query: () => ({
                url: "/users/project-managers",
                method: "GET",
            }),
        }),
        assignProjectManager: builder.mutation<any, { projectId: string; managerId: string }>({
            query: ({ projectId, managerId }) => ({
                url: `/project-requests-admin/${projectId}/assign-manager`,
                method: "PATCH",
                body: { managerId },
            }),
            invalidatesTags: ["Project"],
        }),
        getProjectStats: builder.query<any, void>({
            query: () => ({
                url: "/project-requests-admin/stats",
                method: "GET",
            }),
            providesTags: ["Project"],
        }),
        getTeams: builder.query<Team[], void>({
            query: () => ({
                url: "/teams",
                method: "GET",
            }),
            providesTags: ["Team"],
        }),
        getTeamById: builder.query<Team, string>({
            query: (id) => ({
                url: `/teams/${id}`,
                method: "GET",
            }),
            providesTags: ["Team"],
        }),
        createTeam: builder.mutation<Team, { name: string; memberIds?: string[] }>({
            query: (body) => ({
                url: "/teams",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Team"],
        }),
        updateTeam: builder.mutation<Team, { id: string; name?: string; memberIds?: string[] }>({
            query: ({ id, ...body }) => ({
                url: `/teams/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Team"],
        }),
        deleteTeam: builder.mutation<any, string>({
            query: (id) => ({
                url: `/teams/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Team"],
        }),
        getAssignableMembers: builder.query<{ id: string; name: string; email: string; avatar: string | null; role: string }[], void>({
            query: () => ({
                url: "/teams/assignable-members",
                method: "GET",
            }),
        }),
        assignProjectTeams: builder.mutation<any, { projectId: string; teamIds: string[] }>({
            query: ({ projectId, teamIds }) => ({
                url: `/project-requests-admin/${projectId}/assign-teams`,
                method: "PATCH",
                body: { teamIds },
            }),
            invalidatesTags: ["Project"],
        }),
        startProject: builder.mutation<any, string>({
            query: (id) => ({
                url: `/project-requests-admin/${id}/start`,
                method: "POST",
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
    useGetProposalFullQuery,
    useSubmitNewProposalMutation,
    useAddServiceMutation,
    useUpdateProposalPaymentPlanMutation,
    useReorderProposalServicesMutation,
    useSendProposalToClientMutation,
    useGetMyProposalsQuery,
    useGetSingleProposalQuery,
    useChangeProposalStatusMutation,
    useGetAdminViewAllProposalsQuery,
    useApproveRejectServiceMutation,
    useSignProposalMutation,
    useGetProposalsByProjectRequestQuery,
    useGetStagesByProposalQuery,
    useCompleteStageMutation,
    useUpdateStageMutation,
    useAddStageNoteMutation,
    useStartPhaseTimerMutation,
    useStopPhaseTimerMutation,
    useGetMyProjectRequestsQuery,
    useUpdateProjectDriveLinkMutation,
    useDeleteProjectDriveLinkMutation,
    useDeleteProposalMutation,
    useArchiveProjectMutation,
    useUnarchiveProjectMutation,
    useDeleteProjectMutation,
    useGetArchivedProjectsQuery,
    useGetProjectManagersQuery,
    useAssignProjectManagerMutation,
    useGetProjectStatsQuery,
    useGetTeamsQuery,
    useGetTeamByIdQuery,
    useCreateTeamMutation,
    useUpdateTeamMutation,
    useDeleteTeamMutation,
    useGetAssignableMembersQuery,
    useAssignProjectTeamsMutation,
    useStartProjectMutation,
} = proposalApi;