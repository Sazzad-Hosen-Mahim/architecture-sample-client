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
  }),
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useVerifyEmailMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
