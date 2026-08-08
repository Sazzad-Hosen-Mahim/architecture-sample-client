import { baseApi } from "../baseApi";

interface ConsultationFeeResponse {
    success: boolean;
    data: { feeUsd: number };
}

export const siteSettingsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getConsultationFee: builder.query<ConsultationFeeResponse, void>({
            query: () => ({
                url: "/site-settings/consultation-fee",
                method: "GET",
            }),
            providesTags: ["SiteSettings"],
        }),

        updateConsultationFee: builder.mutation<ConsultationFeeResponse, { feeUsd: number }>({
            query: (body) => ({
                url: "/site-settings/consultation-fee",
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["SiteSettings"],
        }),
    }),
});

export const {
    useGetConsultationFeeQuery,
    useUpdateConsultationFeeMutation,
} = siteSettingsApi;
