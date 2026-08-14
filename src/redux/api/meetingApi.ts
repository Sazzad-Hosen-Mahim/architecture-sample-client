import { baseApi } from "./baseApi";

export type MeetingStatus =
    | "PENDING_CLIENT_REQUEST"
    | "PENDING_RESPONSE"
    | "ACCEPTED"
    | "DECLINED";

export type MeetingType =
    | "INITIAL_CONSULTATION"
    | "PROJECT_KICKOFF"
    | "PHASE_PROGRESS"
    | "GENERAL";

/** Booking granularity shared by every calendar in the app. */
export const SLOT_MINUTES = 30;

/** One occupied range on a manager's calendar — a meeting or blocked-off time. */
export interface BusyRange {
    type: "MEETING" | "BLOCK";
    start: string;
    end: string;
    /**
     * Whether this range actually reserves the slot. Confirmed meetings and
     * blocked time do; a proposal still awaiting a reply is shown as tentative
     * but stays selectable.
     */
    blocking: boolean;
    label: string;
    projectName: string | null;
    status: MeetingStatus | null;
}

export interface AvailabilityResponse {
    success: boolean;
    message: string;
    data: {
        managerId: string | null;
        slotMinutes: number;
        busy: BusyRange[];
    };
}

export interface ScheduleBlock {
    id: string;
    userId: string;
    title: string;
    notes: string | null;
    startAt: string;
    endAt: string;
    allDay: boolean;
    createdById: string;
    createdAt: string;
    user?: { id: string; name: string | null; email: string };
}

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
    /** End of the booked window. Omitted means a single 30-minute slot. */
    endsAt?: string;
    notes: string;
    stageId?: string;
    meetingType?: MeetingType;
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
    endsAt: string;
    notes: string | null;
    status: MeetingStatus;
    meetingType: MeetingType;
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
            invalidatesTags: ["Project", "Schedule"],
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
            providesTags: ["Schedule"],
        }),

        requestMeeting: builder.mutation<
            { success: boolean; message: string },
            {
                projectRequestId: string;
                scheduledAt: string;
                endsAt?: string;
                notes?: string;
                stageId?: string;
                meetingType?: MeetingType;
            }
        >({
            query: (body) => ({
                url: "/project-requests-admin/request-meeting",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Project", "Schedule"],
        }),

        /**
         * Free/busy for the calendar a booking would land on. Clients pass
         * `projectRequestId` (their assigned manager is resolved server-side);
         * staff may target a manager directly.
         */
        getAvailability: builder.query<
            AvailabilityResponse,
            {
                projectRequestId?: string;
                managerId?: string;
                from: string;
                to: string;
                /** Ignore this meeting — used when re-timing or linking one. */
                excludeMeetingId?: string;
            }
        >({
            query: ({ projectRequestId, managerId, from, to, excludeMeetingId }) => ({
                url: "/project-requests-admin/availability",
                method: "GET",
                params: {
                    from,
                    to,
                    ...(projectRequestId ? { projectRequestId } : {}),
                    ...(managerId ? { managerId } : {}),
                    ...(excludeMeetingId ? { excludeMeetingId } : {}),
                },
            }),
            providesTags: ["Schedule"],
        }),

        /**
         * Add the joining link to a meeting that already exists — the follow-up
         * after accepting a client's requested time. Updates that booking in
         * place rather than creating a second one on the same slot.
         */
        attachMeetingLink: builder.mutation<
            SendMeetingResponse,
            {
                meetingId: string;
                meetingUrl: string;
                title?: string;
                notes?: string;
                scheduledAt?: string;
                endsAt?: string;
            }
        >({
            query: ({ meetingId, ...body }) => ({
                url: `/project-requests-admin/meetings/${meetingId}/link`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Project", "Schedule"],
        }),

        /** Remove a meeting entirely — frees its slot and clears the history. */
        deleteMeeting: builder.mutation<
            { success: boolean; message: string },
            string
        >({
            query: (meetingId) => ({
                url: `/project-requests-admin/meetings/${meetingId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Project", "Schedule"],
        }),

        getScheduleBlocks: builder.query<
            { success: boolean; message: string; data: ScheduleBlock[] },
            { managerId?: string; from?: string; to?: string }
        >({
            query: ({ managerId, from, to }) => ({
                url: "/project-requests-admin/schedule-blocks",
                method: "GET",
                params: {
                    ...(managerId ? { managerId } : {}),
                    ...(from ? { from } : {}),
                    ...(to ? { to } : {}),
                },
            }),
            providesTags: ["Schedule"],
        }),

        createScheduleBlock: builder.mutation<
            {
                success: boolean;
                message: string;
                data: ScheduleBlock;
                conflicts: { id: string; title: string; projectName: string | null }[];
            },
            {
                userId?: string;
                title: string;
                notes?: string;
                startAt: string;
                endAt: string;
                allDay?: boolean;
            }
        >({
            query: (body) => ({
                url: "/project-requests-admin/schedule-blocks",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Schedule"],
        }),

        deleteScheduleBlock: builder.mutation<
            { success: boolean; message: string },
            string
        >({
            query: (id) => ({
                url: `/project-requests-admin/schedule-blocks/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Schedule"],
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
            invalidatesTags: ["Project", "Schedule"],
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
    useGetAvailabilityQuery,
    useAttachMeetingLinkMutation,
    useDeleteMeetingMutation,
    useGetScheduleBlocksQuery,
    useCreateScheduleBlockMutation,
    useDeleteScheduleBlockMutation,
} = meetingApi;
