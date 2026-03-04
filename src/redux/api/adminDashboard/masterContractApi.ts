import { baseApi } from "@/redux/api/baseApi";

export interface MasterContractArticle {
    id: string;
    articleKey: string;
    title: string;
    content: string;
    order: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ContractSection {
    articleKey: string;
    title: string;
    content: string;
    order: number;
}

export interface ProposalContract {
    id: string;
    contractSections: ContractSection[] | null;
    architectContractSignature: string | null;
    clientContractSignature: string | null;
    clientContractSignedAt: string | null;
    architectSignature: string | null;
    architectSignedAt: string | null;
    ownerSignature: string | null;
    ownerSignedAt: string | null;
    clientName: string;
    projectName: string;
    projectLocation: string;
    serviceType: string;
    projectDescription: string | null;
    additionalContext: string | null;
    city: string;
    state: string;
    status: string;
    userId: string;
    notes: string | null;
    services: { id: string; name: string; amount: number }[];
}

export const masterContractApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Get all master contract articles
        getMasterContractArticles: builder.query<
            { success: boolean; data: MasterContractArticle[] },
            void
        >({
            query: () => "/master-contract",
            providesTags: ["MasterContract"],
        }),

        // Create a new article
        createMasterContractArticle: builder.mutation<
            { success: boolean; data: MasterContractArticle },
            { articleKey: string; title: string; content: string; order?: number }
        >({
            query: (body) => ({
                url: "/master-contract",
                method: "POST",
                body,
            }),
            invalidatesTags: ["MasterContract"],
        }),

        // Update an article
        updateMasterContractArticle: builder.mutation<
            { success: boolean; data: MasterContractArticle },
            { id: string; title?: string; content?: string; order?: number; isActive?: boolean }
        >({
            query: ({ id, ...body }) => ({
                url: `/master-contract/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["MasterContract"],
        }),

        // Delete an article
        deleteMasterContractArticle: builder.mutation<
            { success: boolean },
            string
        >({
            query: (id) => ({
                url: `/master-contract/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["MasterContract"],
        }),

        // Seed default articles
        seedMasterContract: builder.mutation<
            { success: boolean; data: MasterContractArticle[] },
            void
        >({
            query: () => ({
                url: "/master-contract/seed",
                method: "POST",
            }),
            invalidatesTags: ["MasterContract"],
        }),

        // Client signs contract on a proposal
        clientSignContract: builder.mutation<
            { success: boolean; data: any },
            { proposalId: string; clientSignature: string }
        >({
            query: ({ proposalId, clientSignature }) => ({
                url: `/master-contract/sign/${proposalId}`,
                method: "PATCH",
                body: { clientSignature },
            }),
            invalidatesTags: ["Project"],
        }),

        // Get contract for a proposal
        getContractForProposal: builder.query<
            { success: boolean; data: ProposalContract },
            string
        >({
            query: (proposalId) => `/master-contract/proposal/${proposalId}`,
            providesTags: ["Project"],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetMasterContractArticlesQuery,
    useCreateMasterContractArticleMutation,
    useUpdateMasterContractArticleMutation,
    useDeleteMasterContractArticleMutation,
    useSeedMasterContractMutation,
    useClientSignContractMutation,
    useGetContractForProposalQuery,
} = masterContractApi;
