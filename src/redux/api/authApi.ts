import { baseApi } from "@/redux/api/baseApi";

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  /** Username — stored as the user's display name. */
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  // Optional address details
  country?: string;
  state?: string;
  city?: string;
  streetAddress?: string;
  zipCode?: string;
  companyName?: string;
  aptSuiteUnit?: string;
  /** One-time token from an "Inquiry Accepted" email. */
  claimToken?: string;
}

export interface ClaimInfo {
  valid: boolean;
  expired?: boolean;
  email?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string | null;
  projectName?: string;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  streetAddress?: string | null;
  aptSuiteUnit?: string | null;
  zipCode?: string | null;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<any, LoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
    }),

    register: builder.mutation<any, RegisterRequest>({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
    }),

    verifyEmail: builder.mutation<
      { success: boolean; message: string },
      { token: string }
    >({
      query: (body) => ({
        url: "/auth/verify-email",
        method: "POST",
        body,
      }),
    }),

    forgotPassword: builder.mutation<
      { success: boolean; message: string },
      { email: string }
    >({
      query: (body) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body,
      }),
    }),

    resetPassword: builder.mutation<
      { success: boolean; message: string },
      { token: string; password: string }
    >({
      query: (body) => ({
        url: "/auth/reset-password",
        method: "POST",
        body,
      }),
    }),

    // Prefill + validity for a signup opened from an "Inquiry Accepted" link.
    getClaimInfo: builder.query<{ success: boolean; data: ClaimInfo }, string>({
      query: (token) => ({
        url: `/auth/claim/${encodeURIComponent(token)}`,
        method: "GET",
      }),
    }),

    // "My signup link expired" — re-issues a fresh link to the same email.
    resendClaim: builder.mutation<
      { success: boolean; message: string },
      { email: string }
    >({
      query: (body) => ({
        url: "/auth/claim/resend",
        method: "POST",
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useVerifyEmailMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetClaimInfoQuery,
  useResendClaimMutation,
} = authApi;
