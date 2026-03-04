import { baseApi } from "@/redux/api/baseApi";

export interface AmendmentContractArticle {
    id: string;
    articleKey: string;
    title: string;
    content: string;
    order: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export const amendmentContractApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Get all amendment contract articles
        getAmendmentContractArticles: builder.query<
            { success: boolean; data: AmendmentContractArticle[] },
            void
        >({
            query: () => "/amendment-contract",
            providesTags: ["AmendmentContract"],
        }),

        // Create a new article
        createAmendmentContractArticle: builder.mutation<
            { success: boolean; data: AmendmentContractArticle },
            { articleKey: string; title: string; content: string; order?: number }
        >({
            query: (body) => ({
                url: "/amendment-contract",
                method: "POST",
                body,
            }),
            invalidatesTags: ["AmendmentContract"],
        }),

        // Update an article
        updateAmendmentContractArticle: builder.mutation<
            { success: boolean; data: AmendmentContractArticle },
            { id: string; title?: string; content?: string; order?: number; isActive?: boolean }
        >({
            query: ({ id, ...body }) => ({
                url: `/amendment-contract/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["AmendmentContract"],
        }),

        // Delete an article
        deleteAmendmentContractArticle: builder.mutation<
            { success: boolean },
            string
        >({
            query: (id) => ({
                url: `/amendment-contract/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["AmendmentContract"],
        }),

        // Seed default articles
        seedAmendmentContract: builder.mutation<
            { success: boolean; data: AmendmentContractArticle[] },
            void
        >({
            query: () => ({
                url: "/amendment-contract/seed",
                method: "POST",
            }),
            invalidatesTags: ["AmendmentContract"],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetAmendmentContractArticlesQuery,
    useCreateAmendmentContractArticleMutation,
    useUpdateAmendmentContractArticleMutation,
    useDeleteAmendmentContractArticleMutation,
    useSeedAmendmentContractMutation,
} = amendmentContractApi;
