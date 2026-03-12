import { baseApi } from "./baseApi";

// Meeting interface based on API response
export interface Meeting {
    id: string;
    projectRequestId: string;
    sentToUserId: string;
    sentByUserId: string;
    meetingUrl: string;
    title: string;
    scheduledAt: string;
    notes: string;
    emailSent: boolean;
    emailSentAt: string | null;
    createdAt: string;
    updatedAt: string;
    userId: string | null;
    sentByUser?: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
    sentToUser?: {
        id: string;
        name: string;
        email: string;
    };
    projectRequest?: {
        id: string;
        projectName: string;
        status: string;
    };
}

export interface SendMeetingRequest {
    projectRequestId: string;
    meetingUrl: string;
    title: string;
    scheduledAt: string;
    notes: string;
}

export interface SendMeetingResponse {
    success: boolean;
    message: string;
    emailSent: boolean;
    data: Meeting;
}

export interface GetMeetingsResponse {
    success: boolean;
    message: string;
    data: Meeting[];
}

export interface UserMeeting {
    id: string;
    meetingUrl: string;
    title: string;
    scheduledAt: string;
    notes: string;
    emailSent: boolean;
    createdAt: string;
    projectRequest: {
        id: string;
        projectName: string;
        status: string;
        serviceType: string;
    };
    sentByUser: {
        id: string;
        name: string;
        role: string;
    };
    sentBy: {
        id: string;
        name: string;
        role: string;
    };
}

export interface GetUserMeetingsResponse {
    success: boolean;
    data: UserMeeting[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}

export const meetingApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        sendMeetingLink: builder.mutation<SendMeetingResponse, SendMeetingRequest>({
            query: (body) => ({
                url: "/project-requests-admin/send",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Project"],
        }),

        getMyMeetings: builder.query<GetUserMeetingsResponse, string | void>({
            query: () => ({
                url: `/project-requests-admin/my-meetings`,
                method: "GET",
            }),
            providesTags: ["Project"],
        }),

        requestMeeting: builder.mutation<{ success: boolean; message: string }, { projectRequestId: string; scheduledAt: string; notes?: string }>({
            query: (body) => ({
                url: "/project-requests-admin/request-meeting",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Project"],
        }),
    }),
});

export const {
    useSendMeetingLinkMutation,
    useGetMyMeetingsQuery,
    useRequestMeetingMutation,
} = meetingApi;
