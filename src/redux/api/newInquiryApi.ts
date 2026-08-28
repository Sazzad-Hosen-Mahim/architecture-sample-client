import { baseApi } from "./baseApi";

export interface NewInquiryClientInfo {
    firstName: string;
    lastName: string;
    companyName?: string;
    email: string;
    phone?: string;
    address?: string;
    aptSuiteUnit?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    additionalNotes?: string;
}

export interface NewInquiryProjectInfo {
    projectName: string;
    projectDescription?: string;
    additionalContext?: string;
    streetAddress?: string;
    aptSuiteUnit?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    sameAsMailingAddress?: boolean;
    serviceType?: string;
    /** Free text captured when serviceType is the "Other" option */
    serviceTypeOther?: string;
    projectType?: string;
    /** Free text captured when projectType is "other" */
    projectTypeOther?: string;
    squareFootage?: string;
    budgetRange?: string;
}

export interface CreateNewInquiryRequest {
    clientInfo: NewInquiryClientInfo;
    projectInfo: NewInquiryProjectInfo;
    password?: string;
}

export interface CheckEmailExistsResponse {
    exists: boolean;
    emailVerified: boolean;
    role: string | null;
    hasPassword: boolean;
    /** True only when the PM has to set a password for this client. */
    needsPassword: boolean;
}

export interface NewInquiry {
    id: string;
    clientFirstName: string;
    clientLastName: string;
    companyName: string | null;
    email: string;
    phone: string | null;
    projectName: string;
    serviceType: string;
    projectCategory: string | null;
    budgetRange: string | null;
    status: string;
    isNewInquiry: boolean;
    consultationPaymentId: string | null;
    createdAt: string;
    updatedAt: string;
    user?: {
        id: string;
        name: string;
        email: string;
    };
    proposals?: {
        id: string;
        proposalNumber: string;
        status: string;
        totalAmount: string;
        createdAt: string;
        services?: {
            id: string;
            name: string;
            amount: string;
        }[];
    }[];
    meetingLinks?: {
        id: string;
        title: string;
        scheduledAt: string;
        meetingUrl: string;
        sentByUser?: {
            name: string;
            role: string;
        };
    }[];
}

export interface NewInquiryResponse {
    success: boolean;
    message: string;
    data: NewInquiry;
    clientEmail?: string;
}

export interface GetNewInquiriesResponse {
    success: boolean;
    data: NewInquiry[];
    total: number;
}

export const newInquiryApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        createNewInquiry: builder.mutation<NewInquiryResponse, CreateNewInquiryRequest>({
            query: (body) => ({
                url: "/project-requests-admin/new-inquiry",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Project"],
        }),

        getAllNewInquiries: builder.query<GetNewInquiriesResponse, void>({
            query: () => ({
                url: "/project-requests-admin/new-inquiries/all",
                method: "GET",
            }),
            providesTags: ["Project"],
        }),

        getMyNewInquiries: builder.query<GetNewInquiriesResponse, void>({
            query: () => ({
                url: "/project-requests-admin/new-inquiries/my",
                method: "GET",
            }),
            providesTags: ["Project"],
        }),

        checkEmailExists: builder.query<CheckEmailExistsResponse, string>({
            query: (email) => ({
                url: `/project-requests-admin/check-email?email=${encodeURIComponent(email)}`,
                method: "GET",
            }),
        }),

        attachConsultationPayment: builder.mutation<
            { success: boolean; message: string },
            { projectRequestId: string; paymentIntentId: string }
        >({
            query: ({ projectRequestId, paymentIntentId }) => ({
                url: `/project-requests-admin/${projectRequestId}/pay-consultation`,
                method: "POST",
                body: { paymentIntentId },
            }),
            invalidatesTags: ["Project"],
        }),
    }),
});

export const {
    useCreateNewInquiryMutation,
    useGetAllNewInquiriesQuery,
    useGetMyNewInquiriesQuery,
    useLazyCheckEmailExistsQuery,
    useAttachConsultationPaymentMutation,
} = newInquiryApi;
