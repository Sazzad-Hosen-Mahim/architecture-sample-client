import { baseApi } from "../baseApi";

interface ConsultationFeeResponse {
    success: boolean;
    data: { feeUsd: number };
}

/** Local 24-hour "HH:MM" times, plus the weekdays the office keeps them. */
export interface OfficeHours {
    start: string;
    end: string;
    /** 0 = Sunday … 6 = Saturday. A day not listed is closed. */
    days: number[];
}

interface OfficeHoursResponse {
    success: boolean;
    data: OfficeHours;
}

/** One stretch the consultation calendar is not free, with no detail attached. */
export interface ConsultationBusyRange {
    start: string;
    end: string;
    allDay: boolean;
}

interface ConsultationAvailabilityResponse {
    success: boolean;
    data: ConsultationBusyRange[];
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
            invalidatesTags: ["SiteSettings", "Schedule"],
        }),

        // Time off and confirmed meetings on the consultation calendar. Public,
        // because the New Project wizard runs before sign-up — which is why
        // blocked days weren't greying out there.
        getConsultationAvailability: builder.query<
            ConsultationAvailabilityResponse,
            { from: string; to: string }
        >({
            query: ({ from, to }) => ({
                url: "/site-settings/consultation-availability",
                method: "GET",
                params: { from, to },
            }),
            providesTags: ["Schedule"],
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

        // The firm's YouTube channel, linked from the Media Center. An empty
        // string means none is saved yet.
        getYoutubeChannel: builder.query<
            { success: boolean; data: { url: string } },
            void
        >({
            query: () => ({
                url: "/site-settings/youtube-channel",
                method: "GET",
            }),
            providesTags: ["SiteSettings"],
        }),

        updateYoutubeChannel: builder.mutation<
            { success: boolean; data: { url: string } },
            { url: string }
        >({
            query: (body) => ({
                url: "/site-settings/youtube-channel",
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
    useGetConsultationAvailabilityQuery,
    useGetMediaQuickTagsQuery,
    useUpdateMediaQuickTagsMutation,
    useGetYoutubeChannelQuery,
    useUpdateYoutubeChannelMutation,
} = siteSettingsApi;
