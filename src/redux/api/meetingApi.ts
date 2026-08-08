import { baseApi } from "./baseApi";

export type MeetingStatus =
    | "PENDING_CLIENT_REQUEST"
    | "PENDING_RESPONSE"
    | "ACCEPTED"
    | "DECLINED";

// Meeting interface based on API response
export interface Meeting {
    id: string;
    projectRequestId: string;
    sentToUserId: string;
    sentByUserId: string;
    meetingUrl: string | null;
    title: string;
    scheduledAt: string;
    notes: string;
    emailSent: boolean;
    emailSentAt: string | null;
    createdAt: string;
    updatedAt: string;
    userId: string | null;
    status: MeetingStatus;
    stageId: string | null;
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
    stageId?: string;
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
    meetingUrl: string | null;
    title: string;
    scheduledAt: string;
    notes: string;
    emailSent: boolean;
    createdAt: string;
    status: MeetingStatus;
    stageId: string | null;
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

export interface ScheduleMeeting {
    id: string;
    title: string;
    scheduledAt: string;
    notes: string | null;
    status: MeetingStatus;
    meetingUrl: string | null;
    stageId: string | null;
    projectRequestId: string | null;
    projectName: string;
    clientName: string;
    managerId: string | null;
    managerName: string | null;
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

        // Master Schedule: every meeting across projects, for staff.
        getMasterSchedule: builder.query<
            { success: boolean; message: string; data: ScheduleMeeting[] },
            { managerId?: string; from?: string; to?: string }
        >({
            query: ({ managerId, from, to }) => ({
                url: "/project-requests-admin/schedule",
                method: "GET",
                params: {
                    ...(managerId ? { managerId } : {}),
                    ...(from ? { from } : {}),
                    ...(to ? { to } : {}),
                },
            }),
            providesTags: ["Project"],
        }),

        requestMeeting: builder.mutation<
            { success: boolean; message: string },
            { projectRequestId: string; scheduledAt: string; notes?: string; stageId?: string }
        >({
            query: (body) => ({
                url: "/project-requests-admin/request-meeting",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Project"],
        }),

        // Client opts out of the progress call for a completed phase. Payment is
        // unaffected — this only skips the walkthrough.
        bypassPhaseMeeting: builder.mutation<
            { success: boolean; message: string },
            { stageId: string; bypassed: boolean }
        >({
            query: ({ stageId, bypassed }) => ({
                url: `/project-requests-admin/stages/${stageId}/bypass-meeting`,
                method: "PATCH",
                body: { bypassed },
            }),
            invalidatesTags: ["Project"],
        }),

        // PM toggles whether a phase requires a progress meeting at all.
        setPhaseMeetingRequired: builder.mutation<
            { success: boolean; message: string },
            { stageId: string; meetingRequired: boolean }
        >({
            query: ({ stageId, meetingRequired }) => ({
                url: `/project-requests-admin/stages/${stageId}/meeting-required`,
                method: "PATCH",
                body: { meetingRequired },
            }),
            invalidatesTags: ["Project"],
        }),

        respondToMeeting: builder.mutation<
            { success: boolean; message: string; data: Meeting },
            { meetingId: string; action: "accept" | "reject" }
        >({
            query: ({ meetingId, action }) => ({
                url: `/project-requests-admin/meetings/${meetingId}/respond`,
                method: "PATCH",
                body: { action },
            }),
            invalidatesTags: ["Project"],
        }),
    }),
});

export const {
    useSendMeetingLinkMutation,
    useGetMyMeetingsQuery,
    useGetMasterScheduleQuery,
    useRequestMeetingMutation,
    useRespondToMeetingMutation,
    useBypassPhaseMeetingMutation,
    useSetPhaseMeetingRequiredMutation,
} = meetingApi;
