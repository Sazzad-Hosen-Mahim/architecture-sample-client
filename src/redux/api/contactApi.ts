import { baseApi } from "./baseApi";

export interface ContactMessagePayload {
    name: string;
    email: string;
    message: string;
    subject?: string;
    /** Honeypot — must stay empty for real submissions. */
    website?: string;
}

export interface ContactMessageResponse {
    success: boolean;
    message: string;
}

export const contactApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        sendContactMessage: builder.mutation<ContactMessageResponse, ContactMessagePayload>({
            query: (body) => ({
                url: "/contact",
                method: "POST",
                body,
            }),
        }),
    }),
});

export const { useSendContactMessageMutation } = contactApi;
