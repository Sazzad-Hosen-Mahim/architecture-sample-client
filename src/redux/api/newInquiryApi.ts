import { baseApi } from "./baseApi";

export interface NewInquiryClientInfo {
    firstName: string;
    lastName: string;
    companyName?: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    additionalNotes?: string;
}

export interface NewInquiryProjectInfo {
    projectName: string;
    projectDescription?: string;
    additionalContext?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    sameAsMailingAddress?: boolean;
    serviceType?: string;
    projectType?: string;
    squareFootage?: string;
    budgetRange?: string;
    timeline?: string;
}

export interface CreateNewInquiryRequest {
    clientInfo: NewInquiryClientInfo;
    projectInfo: NewInquiryProjectInfo;
    password: string;
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
    }),
});

export const {
    useCreateNewInquiryMutation,
    useGetAllNewInquiriesQuery,
    useGetMyNewInquiriesQuery,
} = newInquiryApi;
