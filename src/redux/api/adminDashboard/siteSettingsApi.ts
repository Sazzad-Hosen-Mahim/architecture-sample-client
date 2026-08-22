import { baseApi } from "../baseApi";

interface ConsultationFeeResponse {
    success: boolean;
    data: { feeUsd: number };
}

/** Local 24-hour "HH:MM" times. */
export interface OfficeHours {
    start: string;
    end: string;
}

interface OfficeHoursResponse {
    success: boolean;
    data: OfficeHours;
}

interface MediaQuickTagsResponse {
    success: boolean;
    data: string[];
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

        // The daily window clients may book meetings in. Readable by anyone
        // signed in (the booking form needs it); writable by a super admin only.
        getOfficeHours: builder.query<OfficeHoursResponse, void>({
            query: () => ({
                url: "/site-settings/office-hours",
                method: "GET",
            }),
            providesTags: ["SiteSettings"],
        }),

        updateOfficeHours: builder.mutation<OfficeHoursResponse, OfficeHours>({
            query: (body) => ({
                url: "/site-settings/office-hours",
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["SiteSettings"],
        }),

        // Curated "Quick add" tag suggestions on the media form. Independent of
        // the tags attached to published media — removing one only takes it out
        // of the suggestion list.
        getMediaQuickTags: builder.query<MediaQuickTagsResponse, void>({
            query: () => ({
                url: "/site-settings/media-quick-tags",
                method: "GET",
            }),
            providesTags: ["SiteSettings"],
        }),

        updateMediaQuickTags: builder.mutation<
            MediaQuickTagsResponse,
            { tags: string[] }
        >({
            query: (body) => ({
                url: "/site-settings/media-quick-tags",
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
    useGetOfficeHoursQuery,
    useUpdateOfficeHoursMutation,
    useGetMediaQuickTagsQuery,
    useUpdateMediaQuickTagsMutation,
} = siteSettingsApi;
